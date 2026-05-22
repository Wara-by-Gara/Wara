import { Invitation } from '@/lib/api/invitations';

interface Props {
  invitation: Invitation;
}

export default function DetailCard({ invitation }: Props) {
  return (
    <div>
      {/* 이미지 */}
      <div className="relative w-full aspect-[3/4]">
        {invitation.mainImageUrl && (
          <img
            src="https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800"
            alt={invitation.title}
            className="w-full h-full object-cover"
          />
        )}
        <span className="absolute bottom-4 left-4 bg-black text-white text-xs px-2 py-1 rounded">
          PRIVATE EVENT
        </span>
      </div>

      {/* 내용 */}
      <div className="flex flex-col items-center gap-2 py-8 px-4 bg-white">
        <h1 className="text-xl font-medium">{invitation.title}</h1>
        <p className="text-sm text-gray-500">{invitation.description}</p>
        <p className="text-sm font-bold text-gray-900">
          {invitation.eventLocation?.detailAddress}
        </p>
        <hr className="w-12 border-gray-300 mt-2" />
      </div>
    </div>
  );
}
