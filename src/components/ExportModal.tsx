"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  Printer,
} from "lucide-react";
import { CampaignReport } from "@/lib/types";
import { generateMarkdownReport } from "@/lib/utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CampaignReport;
}

export function ExportModal({ isOpen, onClose, report }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"markdown" | "json">("markdown");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownText = generateMarkdownReport(report);
  const jsonText = JSON.stringify(report, null, 2);

  const activeContent = activeTab === "markdown" ? markdownText : jsonText;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `sponsorproof-${report.campaignName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${
      activeTab === "markdown" ? "md" : "json"
    }`;
    const blob = new Blob([activeContent], {
      type: activeTab === "markdown" ? "text/markdown" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#74736F] hover:text-[#252A32] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#252A32]">Export Audit Report</h3>
          <p className="text-xs text-[#74736F]">
            Share results with your sponsor manager, brand agency, or editor
          </p>
        </div>

        {/* Tab Selector & Print Button */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E0D8] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("markdown")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "markdown"
                  ? "bg-[#252A32] text-white"
                  : "bg-[#FAF8F5] text-[#74736F] hover:bg-[#F5F2EC] hover:text-[#252A32]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown (.md)
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "json"
                  ? "bg-[#252A32] text-white"
                  : "bg-[#FAF8F5] text-[#74736F] hover:bg-[#F5F2EC] hover:text-[#252A32]"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Structured JSON
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAF8F5] hover:bg-[#F5F2EC] text-[#252A32] border border-[#E5E0D8] transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#74736F]" />
            Print
          </button>
        </div>

        {/* Code Content Preview */}
        <div className="flex-1 overflow-y-auto mb-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5">
          <pre className="text-xs font-mono text-[#252A32] whitespace-pre-wrap leading-relaxed">
            {activeContent}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D8]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#F5F2EC] text-[#74736F] hover:text-[#252A32] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#EA6A50] hover:bg-[#D8583E] text-white shadow-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Full Report
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#252A32] border border-[#E5E0D8] hover:border-[#D1CBC0] transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#74736F]" />
            Download {activeTab === "markdown" ? ".md" : ".json"}
          </button>
        </div>
      </div>
    </div>
  );
}
