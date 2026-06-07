'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { MenuItem } from '@/components/molecules/MenuItem';
import { Icon } from '@/components/icons';
import { Divider } from '@/components/primitives/Divider';
import { ROUTES } from '@/constants/routes';
import { useActiveFaq } from '@/hooks/useFaq';
import { FaqListSkeleton } from '@/components/organisms/Skeleton';
import { getUserRole } from '@/lib/jwt';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col py-2">
    <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">
      {title}
    </h2>
    <div className="divide-y divide-border bg-surface">{children}</div>
  </section>
);

export default function CustomerSupportPage() {
  const router = useRouter();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: faqItems, isLoading } = useActiveFaq();

  useEffect(() => {
    setIsAdmin(getUserRole() === 'admin');
  }, []);

  function toggleFaq(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0" title="고객센터" onBack={() => router.push(ROUTES.PROFILE.ME)} />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        {/* 자주 묻는 질문 */}
        <Section title="자주 묻는 질문">
          {isLoading && <FaqListSkeleton count={5} />}
          {!isLoading && faqItems?.length === 0 && (
            <p className="px-4 py-3 text-[14px] text-text-tertiary">
              등록된 질문이 없어요
            </p>
          )}
          {faqItems?.map((item) => {
            const isOpen = openIds.has(item.id);
            return (
              <div key={item.id} className="flex flex-col">
                <MenuItem
                  rightSlot={
                    <span
                      className={`inline-flex transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <Icon name="chevron-down" size="sm" color="inactive" decorative />
                    </span>
                  }
                  onClick={() => toggleFaq(item.id)}
                >
                  {item.question}
                </MenuItem>
                {isOpen && (
                  <div className="bg-background-soft px-4 py-3">
                    <p className="text-[14px] leading-relaxed text-text-secondary">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </Section>

        <Divider />

        {/* 문의 */}
        <Section title="문의">
          <MenuItem
            leftIcon="mail"
            rightSlot={
              <Icon name="chevron-right" size="sm" color="inactive" decorative />
            }
            onClick={() => router.push(ROUTES.INQUIRIES.WRITE)}
          >
            문의 보내기
          </MenuItem>
          <MenuItem
            leftIcon="message-circle"
            rightSlot={
              <Icon name="chevron-right" size="sm" color="inactive" decorative />
            }
            onClick={() => router.push(ROUTES.INQUIRIES.ME)}
          >
            나의 문의
          </MenuItem>
        </Section>

        {/* 관리자 전용 섹션 */}
        {isAdmin && (
          <>
            <Divider />
            <Section title="관리">
              <MenuItem
                leftIcon="mail"
                rightSlot={
                  <Icon name="chevron-right" size="sm" color="inactive" decorative />
                }
                onClick={() => router.push(ROUTES.ADMIN.INQUIRIES)}
              >
                문의 관리
              </MenuItem>
              <MenuItem
                leftIcon="message-circle"
                rightSlot={
                  <Icon name="chevron-right" size="sm" color="inactive" decorative />
                }
                onClick={() => router.push(ROUTES.ADMIN.FAQ)}
              >
                자주 묻는 질문 관리
              </MenuItem>
            </Section>
          </>
        )}
      </main>

    </div>
  );
}
