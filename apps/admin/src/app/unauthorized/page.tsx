export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-4xl font-bold text-gray-300 mb-4">403</p>
        <p className="text-gray-600 mb-6">관리자 권한이 없습니다</p>
        <a href="/login" className="text-sm text-blue-600 hover:text-blue-800">
          로그인 페이지로
        </a>
      </div>
    </div>
  );
}
