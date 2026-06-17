import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

// /admin 진입 시 빈 화면 대신 기본 어드민 페이지(문의 관리)로 이동
export default function AdminPage() {
  redirect(ROUTES.ADMIN.INQUIRIES);
}
