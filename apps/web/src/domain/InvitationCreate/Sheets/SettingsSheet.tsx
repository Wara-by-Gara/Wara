"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Button } from "@wara/ui";
import { Switch } from "@wara/ui";
import { Input } from "@wara/ui";
import { BottomSheet } from "@wara/ui";
import { getMissionTemplates } from "@/lib/api/missions";
import {
  RSVP_PACKS,
  RSVP_DEFAULT_LABELS,
  type RsvpType,
  type RsvpOption,
} from "@/domain/InvitationCreate/constants";

export type MissionItem =
  | { type: "template"; templateId: string; content: string }
  | { type: "custom"; localId: string; content: string };

export const MAX_MISSIONS = 10;

function MissionTemplateSection({
  selectedMissions,
  onToggle,
  maxReached,
}: {
  selectedMissions: MissionItem[];
  onToggle: (t: { id: string; content: string }) => void;
  maxReached: boolean;
}) {
  const { data: missionTemplates = [], isLoading } = useQuery({
    queryKey: ["missionTemplates"],
    queryFn: getMissionTemplates,
  });

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-md bg-surface" />;
  }
  if (missionTemplates.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-[14px] font-semibold text-text-primary">시스템 미션</p>
      <div className="flex flex-col gap-2">
        {missionTemplates.map((t) => {
          const isSelected = selectedMissions.some(
            (m) => m.type === "template" && m.templateId === t.id,
          );
          const disabled = !isSelected && maxReached;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(t)}
              className={cn(
                "flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary-soft"
                  : disabled
                  ? "border-border bg-background-soft opacity-50"
                  : "border-border bg-surface hover:bg-gray-50 transition-colors duration-150",
              )}
            >
              <span className={cn("flex-1 text-[14px]", isSelected ? "font-semibold text-primary" : "text-text-primary")}>
                {t.content}
              </span>
              {isSelected && <Icon name="check" size="sm" color="primary" decorative />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /* 미션 */
  missionEnabled: boolean;
  onMissionEnabledChange: (v: boolean) => void;
  selectedMissions: MissionItem[];
  onToggleTemplate: (t: { id: string; content: string }) => void;
  customInput: string;
  onCustomInputChange: (v: string) => void;
  onAddCustom: () => void;
  onRemoveMission: (key: string) => void;
  missionError: boolean;
  /* RSVP */
  rsvpOptions: Record<RsvpType, RsvpOption>;
  onRsvpOptionsChange: (
    updater: (prev: Record<RsvpType, RsvpOption>) => Record<RsvpType, RsvpOption>,
  ) => void;
  selectedPackId: string;
  onSelectPackId: (id: string) => void;
  packDropdownOpen: boolean;
  onPackDropdownChange: (v: boolean) => void;
  editingRsvp: RsvpType | null;
  onEditingRsvpChange: (t: RsvpType | null) => void;
}

export function SettingsSheet(props: SettingsSheetProps) {
  const {
    open,
    onOpenChange,
    missionEnabled,
    onMissionEnabledChange,
    selectedMissions,
    onToggleTemplate,
    customInput,
    onCustomInputChange,
    onAddCustom,
    onRemoveMission,
    missionError,
    rsvpOptions,
    onRsvpOptionsChange,
    selectedPackId,
    onSelectPackId,
    packDropdownOpen,
    onPackDropdownChange,
    editingRsvp,
    onEditingRsvpChange,
  } = props;

  const maxReached = selectedMissions.length >= MAX_MISSIONS;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="설정">
        <div className="flex flex-col gap-6 pt-1">
          {/* 미션 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3.5">
              <div>
                <p className="text-[15px] font-semibold text-text-primary">미션 사용하기</p>
                <p className="text-[13px] text-text-tertiary">게스트에게 미션을 부여할 수 있어요</p>
              </div>
              <Switch checked={missionEnabled} onCheckedChange={onMissionEnabledChange} />
            </div>

            {missionEnabled && (
              <>
                <MissionTemplateSection
                  selectedMissions={selectedMissions}
                  onToggle={onToggleTemplate}
                  maxReached={maxReached}
                />

                <section>
                  <p className="mb-2 text-[14px] font-semibold text-text-primary">직접 입력</p>
                  <div className="flex gap-2">
                    <Input
                      value={customInput}
                      onChange={(e) => onCustomInputChange(e.target.value)}
                      placeholder="미션 내용을 입력하세요 (최대 200자)"
                      maxLength={200}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddCustom(); } }}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={onAddCustom}
                      disabled={!customInput.trim() || maxReached}
                    >
                      추가
                    </Button>
                  </div>
                </section>

                {selectedMissions.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-text-primary">선택된 미션</p>
                      <span className={cn("text-[13px]", maxReached ? "text-danger" : "text-text-tertiary")}>
                        {selectedMissions.length}/{MAX_MISSIONS}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedMissions.map((m) => {
                        const key = m.type === "template" ? m.templateId : m.localId;
                        return (
                          <div key={key} className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3">
                            <span className="flex-1 text-[14px] text-text-primary">{m.content}</span>
                            <button type="button" onClick={() => onRemoveMission(key)} className="shrink-0 text-text-tertiary hover:text-danger">
                              <Icon name="x" size="sm" color="currentColor" decorative />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {missionError && (
                  <p className="text-[13px] text-danger">미션을 최소 1개 이상 선택해주세요</p>
                )}
              </>
            )}
          </div>

          {/* 참석 버튼 꾸미기 */}
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-semibold text-text-primary">참석 버튼 꾸미기</p>

            <div className="relative">
              {packDropdownOpen && (
                <div className="fixed inset-0 z-10" onClick={() => onPackDropdownChange(false)} />
              )}
              <button
                type="button"
                onClick={() => onPackDropdownChange(!packDropdownOpen)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[20px] leading-none">
                    {RSVP_PACKS.find((p) => p.id === selectedPackId)?.attending ?? "🎉"}
                  </span>
                  <span className="text-[14px] font-semibold text-text-primary">
                    {RSVP_PACKS.find((p) => p.id === selectedPackId)?.name ?? "기본"}
                  </span>
                </div>
                <span className={cn("transition-transform", packDropdownOpen ? "rotate-180" : "")}>
                  <Icon name="chevron-down" size="sm" color="inactive" decorative />
                </span>
              </button>

              {packDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
                  {RSVP_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        onRsvpOptionsChange((prev) => ({
                          attending: { ...prev.attending, emoji: pack.attending },
                          maybe: { ...prev.maybe, emoji: pack.maybe },
                          declined: { ...prev.declined, emoji: pack.declined },
                        }));
                        onSelectPackId(pack.id);
                        onPackDropdownChange(false);
                        onEditingRsvpChange(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                        selectedPackId === pack.id ? "bg-surface" : "hover:bg-gray-50 transition-colors duration-150",
                      )}
                    >
                      <span className="text-[20px] leading-none">{pack.attending}</span>
                      <span className="flex-1 text-[15px] font-semibold text-text-primary">{pack.name}</span>
                      {selectedPackId === pack.id && <Icon name="check" size="sm" color="primary" decorative />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["attending", "maybe", "declined"] as RsvpType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onEditingRsvpChange(editingRsvp === type ? null : type)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-md border-2 px-3 py-4 transition-colors",
                    editingRsvp === type ? "border-primary bg-primary-soft" : "border-border bg-surface",
                  )}
                >
                  <span className="text-[32px] leading-none">{rsvpOptions[type].emoji}</span>
                  <span className={cn("text-[13px]", editingRsvp === type ? "font-semibold text-primary" : "text-text-secondary")}>
                    {rsvpOptions[type].label}
                  </span>
                </button>
              ))}
            </div>

            {editingRsvp && (
              <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
                <p className="text-[13px] font-semibold text-text-secondary">버튼 문구</p>
                <Input
                  value={rsvpOptions[editingRsvp].label}
                  onChange={(e) => onRsvpOptionsChange((prev) => ({ ...prev, [editingRsvp]: { ...prev[editingRsvp], label: e.target.value } }))}
                  placeholder={RSVP_DEFAULT_LABELS[editingRsvp]}
                  maxLength={8}
                />
              </div>
            )}
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={() => onOpenChange(false)}>
            완료
          </Button>
        </div>
      </BottomSheet>
  );
}
