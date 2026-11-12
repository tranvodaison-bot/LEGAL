import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenNewDocModal?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenNewDocModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstallable && !isInstalled) {
    return (
      <button
        onClick={install}
        className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] dark:bg-[#2563EB] rounded-lg hover:bg-[#172E6E] dark:hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Cài đặt ứng dụng</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          if (isIOS && !isInstalled) {
            setShowGuideModal(true);
          } else if (onOpenNewDocModal) {
            onOpenNewDocModal();
          } else {
            setShowGuideModal(true);
          }
        }}
        className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] dark:bg-[#2563EB] rounded-lg hover:bg-[#172E6E] dark:hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        <span>{isIOS && !isInstalled ? 'Cài trên iOS' : 'Soạn & Nhập văn bản'}</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FBF9F5] dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] dark:border-[#2E2C28] pb-3">
              <h3 className="text-base font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                Cài đặt ĐẠI SƠN LEGAL đọc ngoại tuyến
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#655E54] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]"
                aria-label="Đóng hướng dẫn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
              <p>
                Ứng dụng <strong>ĐẠI SƠN LEGAL</strong> đã kích hoạt Service Worker lưu trữ ngoại tuyến toàn bộ văn bản pháp luật và bản đồ đối soát chéo.
              </p>
              <div className="p-3.5 rounded-xl bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28] space-y-2 text-xs">
                <p className="font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                  Hướng dẫn đưa ứng dụng ra Màn hình chính:
                </p>
                <p>
                  1. Trên <strong>iPhone / iPad (Safari)</strong>: Nhấn biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh công cụ dưới cùng, sau đó chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
                </p>
                <p>
                  2. Trên <strong>Chrome / Edge (Máy tính & Android)</strong>: Nhấn biểu tượng <strong>Cài đặt ứng dụng</strong> trên thanh địa chỉ trình duyệt.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              {onOpenNewDocModal && (
                <button
                  onClick={() => {
                    setShowGuideModal(false);
                    onOpenNewDocModal();
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-medium hover:bg-[#172E6E] transition-colors whitespace-nowrap"
                >
                  Mở trình nhập văn bản mới
                </button>
              )}
              <button
                onClick={() => setShowGuideModal(false)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] text-xs font-medium text-[#1C1917] dark:text-[#F5F2EB] hover:bg-[#F3EFE6] dark:hover:bg-[#282623] transition-colors whitespace-nowrap"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
