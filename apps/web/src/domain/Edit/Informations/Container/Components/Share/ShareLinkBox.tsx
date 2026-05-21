interface Props {
  shareUrl: string;
  onCopy: () => void;
  copied: boolean;
}

export default function ShareLinkBox({ shareUrl, onCopy, copied }: Props) {
  return (
    <div>
      <p className="text-xs text-wara-label mb-1.5">Share Link</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-wara-surface rounded-lg px-3 py-2.5 text-xs text-wara-body truncate">
          {shareUrl}
        </div>
        <button
          onClick={onCopy}
          className="shrink-0 bg-wara-body text-white text-xs font-semibold px-3 py-2.5 rounded-lg"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
