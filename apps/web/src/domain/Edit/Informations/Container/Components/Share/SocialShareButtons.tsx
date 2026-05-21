interface Props {
  onKakao: () => void;
  onSms: () => void;
  onInstagram: () => void;
}

export default function SocialShareButtons({ onKakao, onSms, onInstagram }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-wara-divider" />
        <span className="text-xs text-wara-placeholder">OR SHARE VIA</span>
        <div className="flex-1 h-px bg-wara-divider" />
      </div>
      <div className="flex justify-center gap-8">
        {/* Kakao */}
        <button onClick={onKakao} className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-xl bg-[#FEE500] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 3C6.58 3 3 5.91 3 9.5c0 2.3 1.52 4.32 3.82 5.48l-.97 3.6 4.2-2.77c.3.04.62.07.95.07 4.42 0 8-2.91 8-6.5S15.42 3 11 3z"
                fill="#3C1E1E"
              />
            </svg>
          </div>
          <span className="text-xs text-wara-label">Kakao</span>
        </button>

        {/* Instagram - 링크 복사 + 앱 열기 */}
        <button onClick={onInstagram} className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="4" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" />
              <circle cx="11" cy="11" r="3.5" stroke="white" strokeWidth="1.5" />
              <circle cx="15.5" cy="6.5" r="1" fill="white" />
            </svg>
          </div>
          <span className="text-xs text-wara-label">Instagram</span>
        </button>

        {/* SMS - functional */}
        <button onClick={onSms} className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-xl bg-wara-surface flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M4 5h14a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 3V6a1 1 0 011-1z"
                stroke="#58423d"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xs text-wara-label">SMS</span>
        </button>
      </div>
    </div>
  );
}
