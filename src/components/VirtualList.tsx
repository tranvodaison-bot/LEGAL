import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

export interface VirtualListProps<T> {
  items: readonly T[];
  itemHeight: number | ((item: T, index: number) => number);
  overscan?: number;
  className?: string;
  innerClassName?: string;
  defaultViewportHeight?: number;
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}

/**
 * Production VirtualList Component:
 * - Supports both fixed and variable row heights via prefix-sum offset array + O(log N) binary search.
 * - Uses ResizeObserver to automatically adapt to flex-1 container height changes.
 * - Renders only visible DOM nodes + overscan buffer using GPU-accelerated translateY positioning.
 */
function VirtualListInner<T>({
  items,
  itemHeight,
  overscan = 6,
  className = '',
  innerClassName = '',
  defaultViewportHeight = 520,
  getItemKey,
  renderItem,
  emptyState,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(defaultViewportHeight);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeight = () => {
      if (el.clientHeight > 0) {
        setViewportHeight(el.clientHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Precompute prefix-sum offsets and item heights in O(N) when items or itemHeight change
  const { offsets, heights, totalHeight } = useMemo(() => {
    const n = items.length;
    const offs = new Array<number>(n);
    const hts = new Array<number>(n);
    let runningOffset = 0;

    const isFn = typeof itemHeight === 'function';
    for (let i = 0; i < n; i++) {
      offs[i] = runningOffset;
      const h = isFn
        ? (itemHeight as (item: T, index: number) => number)(items[i], i)
        : (itemHeight as number);
      hts[i] = h;
      runningOffset += h;
    }

    return {
      offsets: offs,
      heights: hts,
      totalHeight: runningOffset,
    };
  }, [items, itemHeight]);

  // O(log N) binary search for visible window [startIndex, endIndex]
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const n = items.length;
    if (n === 0) {
      return { startIndex: 0, endIndex: -1, offsetY: 0 };
    }

    // Binary search for first item whose bottom edge (offsets[i] + heights[i]) > scrollTop
    let low = 0;
    let high = n - 1;
    let firstVisible = 0;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      if (offsets[mid] + heights[mid] <= scrollTop) {
        low = mid + 1;
      } else {
        firstVisible = mid;
        high = mid - 1;
      }
    }

    const targetBottom = scrollTop + viewportHeight;
    let lastVisible = firstVisible;
    while (lastVisible < n - 1 && offsets[lastVisible] < targetBottom) {
      lastVisible += 1;
    }

    const start = Math.max(0, firstVisible - overscan);
    const end = Math.min(n - 1, lastVisible + overscan);

    return {
      startIndex: start,
      endIndex: end,
      offsetY: offsets[start] || 0,
    };
  }, [items.length, offsets, heights, scrollTop, viewportHeight, overscan]);

  const visibleSlice = useMemo(() => {
    if (endIndex < startIndex || items.length === 0) return [];
    const result: Array<{ item: T; index: number; height: number }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        height: heights[i],
      });
    }
    return result;
  }, [items, heights, startIndex, endIndex]);

  if (items.length === 0 && emptyState) {
    return (
      <div ref={containerRef} className={`overflow-y-auto ${className}`}>
        {emptyState}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
    >
      <div
        className={`relative w-full ${innerClassName}`}
        style={{ height: `${totalHeight}px` }}
      >
        <div
          className="absolute left-0 right-0 top-0 will-change-transform"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleSlice.map(({ item, index, height }) => (
            <div
              key={getItemKey(item, index)}
              style={{ height: `${height}px` }}
              className="w-full box-border"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VirtualList = React.memo(VirtualListInner) as typeof VirtualListInner;
