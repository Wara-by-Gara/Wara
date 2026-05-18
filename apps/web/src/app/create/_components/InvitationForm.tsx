"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import LocationSearch from "./LocationSearch";

const invitationSchema = z.object({
  eventTitle: z.string().min(1, "이벤트 제목을 입력해주세요"),
  date: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/, "날짜를 선택해주세요"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "시간을 선택해주세요").or(z.literal("")),
  location: z.string().min(1, "장소를 입력해주세요"),
  hostNote: z.string(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface InvitationFormErrors {
  eventTitle?: string;
  date?: string;
  time?: string;
  location?: string;
}

interface InvitationFormProps {
  isLoggedIn: boolean;
  initialValues?: Partial<InvitationFormData>;
  onChange: (data: Partial<InvitationFormData> & { coverImageUrl?: string | null }) => void;
  onSubmit: () => void;
}

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a73921" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const labelClass = "block text-[11px] font-bold tracking-widest text-[#58423d] mb-2";
const inputClass =
  "w-full bg-[#f5f3f3] text-[#1b1c1c] text-base px-4 py-3 rounded-lg outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#a73921]/30";

export default function InvitationForm({ isLoggedIn, initialValues, onChange, onSubmit }: InvitationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [fields, setFields] = useState<InvitationFormData>({
    eventTitle: initialValues?.eventTitle ?? "",
    date: initialValues?.date ?? "",
    time: initialValues?.time ?? "",
    location: initialValues?.location ?? "",
    hostNote: initialValues?.hostNote ?? "",
  });
  const [errors, setErrors] = useState<InvitationFormErrors>({});

  const update = (patch: Partial<InvitationFormData>) => {
    const next = { ...fields, ...patch };
    setFields(next);
    onChange(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    const url = file ? URL.createObjectURL(file) : null;
    onChange({ coverImageUrl: url });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = invitationSchema.safeParse(fields);
    if (!result.success) {
      const fieldErrors: InvitationFormErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof InvitationFormErrors;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="font-serif text-[#a73921] text-3xl font-semibold">Design Your Moment</h2>

      {/* COVER ILLUSTRATION */}
      <div>
        <label className={labelClass}>COVER ILLUSTRATION</label>
        <div className="bg-[#f5f3f3] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2 py-4">
            <UploadIcon />
            <p className="text-[#1b1c1c] text-base">Upload a Main Photo</p>
            <p className="text-[#505f78] text-xs">JPG, PNG or GIF. Recommended ratio 4:5</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#eeeeee] text-[#1b1c1c] text-base px-4 py-2 rounded-md cursor-pointer hover:bg-[#e0e0e0] transition-colors"
            >
              Choose File
            </button>
            <span className="text-[#1b1c1c] text-base truncate max-w-[180px]">
              {coverFile ? coverFile.name : "No file chosen"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* EVENT TITLE */}
      <div>
        <label className={labelClass}>EVENT TITLE <span className="text-[#a73921]">*</span></label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. A Cozy Evening Under the Stars"
          value={fields.eventTitle}
          onChange={(e) => update({ eventTitle: e.target.value })}
        />
        {errors.eventTitle && (
          <p className="mt-1 text-xs text-[#a73921]">{errors.eventTitle}</p>
        )}
      </div>

      {/* STARTS AT */}
      <div>
        <label className={labelClass}>STARTS AT <span className="text-[#a73921]">*</span></label>
        <div className="flex gap-3">
          <DatePicker
            value={fields.date}
            onChange={(v) => update({ date: v })}
          />
          <TimePicker
            value={fields.time}
            onChange={(v) => update({ time: v })}
          />
        </div>
        {(errors.date || errors.time) && (
          <p className="mt-1 text-xs text-[#a73921]">{errors.date ?? errors.time}</p>
        )}
      </div>

      {/* LOCATION */}
      <div>
        <label className={labelClass}>LOCATION <span className="text-[#a73921]">*</span></label>
        <LocationSearch
          value={fields.location}
          onChange={(v) => update({ location: v })}
        />
        {errors.location && (
          <p className="mt-1 text-xs text-[#a73921]">{errors.location}</p>
        )}
      </div>

      {/* HOST'S NOTE */}
      <div>
        <label className={labelClass}>HOST&apos;S NOTE</label>
        <textarea
          className={`${inputClass} resize-none h-28`}
          placeholder="Share details about the dress code, parking, or what to bring..."
          value={fields.hostNote}
          onChange={(e) => update({ hostNote: e.target.value })}
        />
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        className="w-full bg-[#a73921] text-white text-xs font-bold tracking-widest py-4 rounded-xl hover:bg-[#8f2e17] transition-colors cursor-pointer"
      >
        {isLoggedIn ? "SEND" : "CREATE"}
      </button>
    </form>
  );
}
