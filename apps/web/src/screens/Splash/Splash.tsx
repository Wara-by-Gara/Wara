"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Modal, ModalContent, ModalClose } from "@/components/molecules/Modal";
import * as Dialog from "@radix-ui/react-dialog";

export type SplashState =
  | "default"
  | "default_new"
  | "default_new_2"
  | "loading"
  | "networkError"
  | "serverMaintenance"
  | "updateRequired"
  | "forceUpdate"
  | "optionalUpdate"
  | "autoLoginLoading"
  | "autoLoginFailed";

export interface SplashProps {
  state?: SplashState;
  onRetry?: () => void;
  onUpdate?: () => void;
  onSkipUpdate?: () => void;
  onStart?: () => void;
  onBrowseWithoutLogin?: () => void;
}

const SplashLoadingIndicator = () => (
  <div
    className="relative inline-flex size-20 items-center justify-center rounded-3xl bg-primary-soft"
    role="status"
    aria-label="로딩 중"
  >
    <span className="size-10 animate-spin rounded-full border-[3px] border-primary border-r-transparent" />
  </div>
);

const LogoBlock = ({ loading = false }: { loading?: boolean }) => (
  <div className="flex flex-col items-center gap-3">
    {loading ? (
      <SplashLoadingIndicator />
    ) : (
      <div className="relative inline-flex size-20 items-center justify-center rounded-3xl bg-primary-soft">
        <Icon name="send" size="xl" color="primary" decorative />
      </div>
    )}
    <h1 className="text-[28px] font-extrabold tracking-tight text-text-primary">Wara</h1>
    <p className="text-[14px] text-text-tertiary">요즘 모이는 방식</p>
  </div>
);

const SplashDefaultNew = ({
  backgroundSrc,
  onStart,
}: Pick<SplashProps, "onStart"> & { backgroundSrc: string }) => (
  <main className="relative flex h-full min-h-full w-full flex-col overflow-hidden">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={backgroundSrc}
      alt=""
      className="absolute inset-0 size-full object-cover object-center"
    />
    <div className="relative z-10 mt-auto px-6 pb-[max(2.75rem,calc(env(safe-area-inset-bottom)+2.75rem))]">
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={onStart}
        className="border-0 bg-white text-text-primary shadow-md hover:bg-white/95 active:bg-white/90"
      >
        시작하기
      </Button>
    </div>
  </main>
);

export const Splash = ({
  state = "default",
  onRetry,
  onUpdate,
  onSkipUpdate: _onSkipUpdate,
  onStart,
  onBrowseWithoutLogin: _onBrowseWithoutLogin,
}: SplashProps) => {
  if (state === "default_new") {
    return <SplashDefaultNew backgroundSrc="/splash-default-new.png" onStart={onStart} />;
  }

  if (state === "default_new_2") {
    return <SplashDefaultNew backgroundSrc="/splash-default-new-2.png" onStart={onStart} />;
  }

  const showModal = ["networkError", "serverMaintenance", "updateRequired", "forceUpdate", "optionalUpdate", "autoLoginFailed"].includes(state);
  const isLoading = state === "loading";
  const isAutoLoginLoading = state === "autoLoginLoading";

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-12 overflow-hidden bg-background px-6 py-20">
      <LogoBlock loading={isLoading} />

      {isAutoLoginLoading ? (
        <div className="flex flex-col items-center gap-2">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-r-transparent" aria-hidden />
          <span className="text-[13px] text-text-tertiary">로그인 중...</span>
        </div>
      ) : null}

      <Modal open={showModal}>
        {state === "networkError" && (
          <ModalContent contained>
            <div className="flex flex-col items-center gap-3 text-center">
              <Icon name="wifi" size="lg" color="inactive" decorative />
              <Dialog.Title className="text-[18px] font-bold text-text-primary">인터넷에 연결되지 않았어요</Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-secondary">네트워크를 확인하고 다시 시도해주세요</Dialog.Description>
              <ModalClose asChild>
                <Button variant="outline" fullWidth onClick={onRetry}>다시 시도</Button>
              </ModalClose>
            </div>
          </ModalContent>
        )}

        {state === "serverMaintenance" && (
          <ModalContent contained>
            <div className="flex flex-col items-center gap-3 text-center">
              <Icon name="alert-triangle" size="lg" color="danger" decorative />
              <Dialog.Title className="text-[18px] font-bold text-text-primary">잠시 점검 중이에요</Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-secondary">조금 뒤에 다시 시도해주세요</Dialog.Description>
              <ModalClose asChild>
                <Button variant="outline" fullWidth>확인</Button>
              </ModalClose>
            </div>
          </ModalContent>
        )}

        {(state === "updateRequired" || state === "forceUpdate") && (
          <ModalContent contained>
            <div className="flex flex-col items-center gap-3 text-center">
              <Icon name="alert-circle" size="lg" color="primary" decorative />
              <Dialog.Title className="text-[18px] font-bold text-text-primary">새 버전이 필요해요</Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-secondary">최신 버전으로 업데이트해주세요</Dialog.Description>
              <ModalClose asChild>
                <Button variant="primary" fullWidth onClick={onUpdate}>업데이트하기</Button>
              </ModalClose>
            </div>
          </ModalContent>
        )}

        {state === "optionalUpdate" && (
          <ModalContent contained>
            <div className="flex flex-col items-center gap-2.5 text-center">
              <Icon name="sparkle" size="lg" color="primary" decorative />
              <Dialog.Title className="text-[17px] font-bold text-text-primary">새 기능이 도착했어요</Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-secondary">지금 업데이트해보세요</Dialog.Description>
              <div className="flex w-full gap-2 pt-1">
                <ModalClose asChild>
                  <Button variant="outline" fullWidth onClick={_onSkipUpdate}>나중에</Button>
                </ModalClose>
                <ModalClose asChild>
                  <Button variant="primary" fullWidth onClick={onUpdate}>업데이트</Button>
                </ModalClose>
              </div>
            </div>
          </ModalContent>
        )}

        {state === "autoLoginFailed" && (
          <ModalContent contained>
            <div className="flex flex-col items-center gap-3 text-center">
              <Icon name="user-x" size="lg" color="inactive" decorative />
              <Dialog.Title className="text-[18px] font-bold text-text-primary">자동 로그인이 풀렸어요</Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-secondary">다시 로그인해주세요</Dialog.Description>
              <ModalClose asChild>
                <Button variant="primary" fullWidth onClick={onRetry}>로그인하기</Button>
              </ModalClose>
            </div>
          </ModalContent>
        )}
      </Modal>

      <footer className="absolute bottom-8 text-[11px] text-text-tertiary">v0.1.0</footer>
    </main>
  );
};
