"use client";

import React, { useMemo } from "react";
import { DeliverableType } from "@/lib/types";
import {
  Video,
  Camera,
  Mic,
  Mail,
  Smartphone,
  Clock,
  Sparkles,
} from "lucide-react";

interface ContentPreviewProps {
  content: string;
  deliverableType: DeliverableType;
  campaignName: string;
}

export function ContentPreview({
  content,
  deliverableType,
  campaignName,
}: ContentPreviewProps) {
  // Extract detected entities for interactive highlights in the preview
  const { highlightedSegments, hashtagList, urlList, hasDisclosure } =
    useMemo(() => {
      if (!content) {
        return {
          highlightedSegments: [],
          hashtagList: [],
          urlList: [],
          hasDisclosure: false,
        };
      }

      const hashtags = Array.from(
        new Set(
          (content.match(/#[a-zA-Z0-9_]+/g) || []).map((h) => h.toLowerCase())
        )
      );

      const urls = Array.from(
        new Set(
          content.match(
            /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/g
          ) || []
        )
      );

      const disclosureRegex =
        /\b(#ad|#sponsored|#partner|#paidpartnership|sponsored by|thanks to .* for sponsoring)\b/i;
      const hasDiscl = disclosureRegex.test(content);

      // Tokenize text to highlight hashtags, links, and disclosures
      const regex =
        /(#[a-zA-Z0-9_]+|https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*|\b(?:#ad|#sponsored|#partner|#paidpartnership|sponsored by)\b)/gi;

      const segments: { text: string; type: "normal" | "hashtag" | "url" | "disclosure" }[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          segments.push({
            text: content.slice(lastIndex, match.index),
            type: "normal",
          });
        }
        const val = match[0];
        if (val.startsWith("#")) {
          if (val.toLowerCase() === "#ad" || val.toLowerCase() === "#sponsored") {
            segments.push({ text: val, type: "disclosure" });
          } else {
            segments.push({ text: val, type: "hashtag" });
          }
        } else if (val.toLowerCase().includes("sponsor")) {
          segments.push({ text: val, type: "disclosure" });
        } else {
          segments.push({ text: val, type: "url" });
        }
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < content.length) {
        segments.push({
          text: content.slice(lastIndex),
          type: "normal",
        });
      }

      return {
        highlightedSegments: segments,
        hashtagList: hashtags,
        urlList: urls,
        hasDisclosure: hasDiscl,
      };
    }, [content]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const spokenSeconds = Math.round((wordCount / 140) * 60);
  const spokenFormatted =
    spokenSeconds >= 60
      ? `${Math.floor(spokenSeconds / 60)}m ${spokenSeconds % 60}s`
      : `${spokenSeconds}s`;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Preview Header */}
      <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {deliverableType.includes("YOUTUBE") && (
            <Video className="w-4 h-4 text-[#EA6A50]" />
          )}
          {deliverableType.includes("INSTAGRAM") && (
            <Camera className="w-4 h-4 text-[#73536D]" />
          )}
          {deliverableType.includes("TIKTOK") && (
            <Smartphone className="w-4 h-4 text-[#252A32]" />
          )}
          {deliverableType.includes("PODCAST") && (
            <Mic className="w-4 h-4 text-[#347C68]" />
          )}
          {deliverableType.includes("NEWSLETTER") && (
            <Mail className="w-4 h-4 text-[#B45309]" />
          )}
          <span className="text-xs font-bold text-[#252A32]">
            {deliverableType.replace(/_/g, " ")} Content Preview
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#74736F]">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#347C68]" />
            ~{spokenFormatted} spoken
          </span>
          <span>•</span>
          <span className="font-mono text-[11px]">{wordCount} words</span>
        </div>
      </div>

      {/* Disclaimers & entity strip */}
      <div className="px-4 py-2 bg-[#FAF8F5]/60 border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#74736F]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#252A32]">Detected Elements:</span>
          {hasDisclosure ? (
            <span className="px-1.5 py-0.5 rounded bg-[#EDF5F2] text-[#347C68] border border-[#C2DFD4] font-medium">
              Disclosure Detected
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-[#FDF2F0] text-[#C53929] border border-[#F5C7C0] font-medium">
              No Disclosure Tag
            </span>
          )}

          {hashtagList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#73536D] border border-[#E5E0D8] font-medium">
              {hashtagList.length} Tag{hashtagList.length > 1 ? "s" : ""}
            </span>
          )}

          {urlList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#252A32] border border-[#E5E0D8] font-medium">
              {urlList.length} Link{urlList.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <span className="italic text-[10px] text-[#74736F]">
          Simulation preview — not an external platform embed
        </span>
      </div>

      {/* Preview Body based on deliverable */}
      <div className="p-5 flex-1 overflow-y-auto bg-white">
        {!content.trim() ? (
          <div className="text-center py-12 text-[#74736F] text-xs">
            Type or paste draft content in the editor to see your live preview here.
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-4">
            {/* YouTube Description Box / Spoken Read */}
            {deliverableType.includes("YOUTUBE") && (
              <div className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white shadow-xs">
                {/* Mock Video Player Frame */}
                <div className="aspect-video bg-[#252A32] flex items-center justify-center relative p-4 text-center">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white backdrop-blur-xs">
                    <Sparkles className="w-3 h-3 text-[#EA6A50]" />
                    Sponsored Segment (~{spokenFormatted})
                  </div>
                  <p className="text-xs text-white/90 italic max-w-md line-clamp-3 px-4">
                    &ldquo;{content.slice(0, 140)}...&rdquo;
                  </p>
                </div>

                {/* Description Box */}
                <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8] space-y-2">
                  <div className="text-[11px] font-bold text-[#74736F] uppercase tracking-wider">
                    Video Description & Pinned Comment
                  </div>
                  <div className="text-xs text-[#252A32] leading-relaxed whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-[#E5E0D8]">
                    {renderFormattedSegments(highlightedSegments)}
                  </div>
                </div>
              </div>
            )}

            {/* Instagram Post & Caption Preview */}
            {deliverableType === "INSTAGRAM_POST" && (
              <div className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white shadow-xs">
                {/* Creator Header */}
                <div className="p-3 flex items-center justify-between border-b border-[#E5E0D8]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#73536D] text-white text-xs font-bold flex items-center justify-center">
                      CS
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#252A32]">creator_official</div>
                      <div className="text-[10px] text-[#74736F]">
                        Paid partnership with {campaignName.split("-")[0].trim()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#74736F]">
                    Sponsored
                  </span>
                </div>

                {/* Visual Placeholder */}
                <div className="aspect-square bg-[#F5F2EC] flex flex-col items-center justify-center text-[#74736F] p-4 text-center border-b border-[#E5E0D8]">
                  <Camera className="w-8 h-8 text-[#73536D]/60 mb-2" />
                  <span className="text-xs font-medium text-[#252A32]">
                    Sponsored Creative Asset
                  </span>
                  <span className="text-[10px] text-[#74736F] mt-1">
                    1:1 Square Feed Asset (Photo or Carousel)
                  </span>
                </div>

                {/* Caption Area */}
                <div className="p-4 space-y-2 text-xs leading-relaxed text-[#252A32] whitespace-pre-wrap">
                  <span className="font-bold mr-1.5">creator_official</span>
                  {renderFormattedSegments(highlightedSegments)}
                </div>
              </div>
            )}

            {/* TikTok / Reel Vertical Video Preview */}
            {deliverableType === "TIKTOK_REELS" && (
              <div className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="aspect-[9/12] max-h-[420px] bg-[#252A32] text-white p-5 flex flex-col justify-between relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-black/50 text-[10px] text-white font-medium backdrop-blur-xs">
                      Reel / Short Preview
                    </span>
                    <span className="text-[10px] text-[#EA6A50] font-bold">
                      ~{spokenFormatted}
                    </span>
                  </div>

                  <div className="space-y-2 bg-black/60 p-3.5 rounded-xl backdrop-blur-xs border border-white/10">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <span>@creator</span>
                      {hasDisclosure && (
                        <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] uppercase font-semibold">
                          #ad
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/90 leading-snug line-clamp-4">
                      {content}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Podcast Read Transcript */}
            {deliverableType === "PODCAST_READ" && (
              <div className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E0D8]">
                  <div className="w-10 h-10 rounded-xl bg-[#EDF5F2] text-[#347C68] flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#252A32]">
                      Host-Read Sponsor Integration
                    </div>
                    <div className="text-[11px] text-[#74736F]">
                      Target cadence: 45–60s mid-roll delivery
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8] space-y-2">
                  <div className="text-[11px] font-bold uppercase text-[#74736F] tracking-wider">
                    Teleprompter Readout Script
                  </div>
                  <div className="text-xs text-[#252A32] leading-relaxed whitespace-pre-wrap font-mono">
                    {renderFormattedSegments(highlightedSegments)}
                  </div>
                </div>
              </div>
            )}

            {/* Newsletter Sponsorship Slot */}
            {deliverableType === "NEWSLETTER" && (
              <div className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white shadow-xs p-5 space-y-3">
                <div className="text-[11px] font-bold text-[#73536D] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Newsletter Sponsor Section
                </div>
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] space-y-2.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#74736F]">
                    Presented by {campaignName.split("-")[0].trim()}
                  </span>
                  <div className="text-xs text-[#252A32] leading-relaxed whitespace-pre-wrap">
                    {renderFormattedSegments(highlightedSegments)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function renderFormattedSegments(
  segments: { text: string; type: "normal" | "hashtag" | "url" | "disclosure" }[]
) {
  return segments.map((seg, idx) => {
    if (seg.type === "hashtag") {
      return (
        <span
          key={idx}
          className="text-[#73536D] font-semibold bg-[#73536D]/10 px-1 py-0.5 rounded mx-0.5"
        >
          {seg.text}
        </span>
      );
    }
    if (seg.type === "url") {
      return (
        <span
          key={idx}
          className="text-[#EA6A50] font-medium underline underline-offset-2 mx-0.5"
        >
          {seg.text}
        </span>
      );
    }
    if (seg.type === "disclosure") {
      return (
        <span
          key={idx}
          className="text-[#347C68] font-bold bg-[#EDF5F2] border border-[#C2DFD4] px-1.5 py-0.5 rounded mx-0.5"
        >
          {seg.text}
        </span>
      );
    }
    return <span key={idx}>{seg.text}</span>;
  });
}
