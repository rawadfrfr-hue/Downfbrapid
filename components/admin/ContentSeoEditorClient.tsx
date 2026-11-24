'use client';

import React, { useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  CmsLanguageRecord,
  CmsPageContentRecord,
  CmsPageSlug,
  PAGE_SLUGS,
} from '@/lib/cms-types';

interface ContentSeoEditorClientProps {
  languages: CmsLanguageRecord[];
  initialLanguageCode: string;
  initialSlug: CmsPageSlug;
  initialContent: CmsPageContentRecord;
}

const SLUG_LABELS: Record<CmsPageSlug, string> = {
  home: 'Home (All-in-One)',
  facebook: 'Facebook Downloader',
  youtube: 'YouTube Downloader',
  instagram: 'Instagram Downloader',
  tiktok: 'TikTok Downloader',
  'youtube-transcript': 'YouTube Transcript Tool',
};

export function ContentSeoEditorClient({
  languages,
  initialLanguageCode,
  initialSlug,
  initialContent,
}: ContentSeoEditorClientProps) {
  const [selectedLang, setSelectedLang] = useState(initialLanguageCode);
  const [selectedSlug, setSelectedSlug] = useState<CmsPageSlug>(initialSlug);
  const [form, setForm] = useState<CmsPageContentRecord>(initialContent);
  const [keywordsText, setKeywordsText] = useState(initialContent.seoKeywords.join(', '));
  const [activeTab, setActiveTab] = useState<'hero' | 'guide' | 'seo'>('hero');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPageContent = async (lang: string, slug: CmsPageSlug) => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await fetch(
        `/api/admin/content?lang=${encodeURIComponent(lang)}&slug=${encodeURIComponent(slug)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load page content.');
      }
      setForm(json.data);
      setKeywordsText((json.data.seoKeywords || []).join(', '));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load content.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (nextLang: string) => {
    setSelectedLang(nextLang);
    loadPageContent(nextLang, selectedSlug);
  };

  const handleSlugChange = (nextSlug: CmsPageSlug) => {
    setSelectedSlug(nextSlug);
    loadPageContent(selectedLang, nextSlug);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const keywords = keywordsText
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          ...form,
          languageCode: selectedLang,
          pageSlug: selectedSlug,
          seoKeywords: keywords,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save changes.');
      }
      setForm(json.data);
      setStatusMsg(
        `Saved ${SLUG_LABELS[selectedSlug]} (${selectedLang.toUpperCase()}) and revalidated live route cache.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const livePreviewPath = (() => {
    const base = selectedSlug === 'home' ? '' : `/${selectedSlug}`;
    return selectedLang === 'en' ? base || '/' : `/${selectedLang}${base}`;
  })();

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
            Content, How-To, FAQ & SEO Editor
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Customize localized page copy, step-by-step guides, FAQs, and Open Graph metadata without touching code.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={livePreviewPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Preview {livePreviewPath}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#166fe5] rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving & Purging...' : 'Save & Revalidate'}</span>
          </button>
        </div>
      </div>

      {/* Language + Page Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="cms-lang-select" className="text-xs font-semibold text-slate-600">
              Language:
            </label>
            <select
              id="cms-lang-select"
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-[#1877F2]"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.code}) {!l.isActive ? '— Inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="cms-slug-select" className="text-xs font-semibold text-slate-600">
              Page:
            </label>
            <select
              id="cms-slug-select"
              value={selectedSlug}
              onChange={(e) => handleSlugChange(e.target.value as CmsPageSlug)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-[#1877F2]"
            >
              {PAGE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {SLUG_LABELS[slug]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto">
          {(
            [
              { id: 'hero', label: 'Hero & Guide' },
              { id: 'guide', label: 'How-To & FAQs' },
              { id: 'seo', label: 'SEO & Open Graph' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded-lg" />
          <div className="h-24 w-full bg-slate-100 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Tab 1: Hero & Guide */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">Hero & Input Copy</h2>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Hero Title (H1)</label>
                  <input
                    type="text"
                    required
                    value={form.heroTitle}
                    onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Hero Subtitle</label>
                  <textarea
                    rows={3}
                    required
                    value={form.heroSubtitle}
                    onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    URL Input Placeholder
                  </label>
                  <input
                    type="text"
                    required
                    value={form.placeholder}
                    onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">Editorial Guide & Supported Formats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Guide Kicker</label>
                    <input
                      type="text"
                      value={form.guideBadge}
                      onChange={(e) => setForm({ ...form, guideBadge: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Guide Title</label>
                    <input
                      type="text"
                      value={form.guideTitle}
                      onChange={(e) => setForm({ ...form, guideTitle: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Guide Paragraphs</label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, guideParagraphs: [...form.guideParagraphs, ''] })
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1877F2] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Paragraph</span>
                    </button>
                  </div>
                  {form.guideParagraphs.map((para, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <textarea
                        rows={3}
                        value={para}
                        onChange={(e) => {
                          const next = [...form.guideParagraphs];
                          next[idx] = e.target.value;
                          setForm({ ...form, guideParagraphs: next });
                        }}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            guideParagraphs: form.guideParagraphs.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-2 text-slate-400 hover:text-rose-700 rounded-lg cursor-pointer"
                        title="Remove paragraph"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Tab 2: How-To & FAQs */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">How to Download Steps</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Displayed on the page and exported automatically as HowTo Schema JSON-LD
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        howToSteps: [...form.howToSteps, { title: '', description: '' }],
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {form.howToSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-500">
                          Step 0{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              howToSteps: form.howToSteps.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-xs text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Step title"
                        value={step.title}
                        onChange={(e) => {
                          const next = [...form.howToSteps];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setForm({ ...form, howToSteps: next });
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                      />
                      <textarea
                        rows={2}
                        placeholder="Step instructions"
                        value={step.description}
                        onChange={(e) => {
                          const next = [...form.howToSteps];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setForm({ ...form, howToSteps: next });
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rendered in the FAQ accordion and synced to FAQPage Schema JSON-LD
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        faqs: [...form.faqs, { question: '', answer: '' }],
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add FAQ</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {form.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-500">
                          FAQ #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              faqs: form.faqs.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-xs text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...form.faqs];
                          next[idx] = { ...next[idx], question: e.target.value };
                          setForm({ ...form, faqs: next });
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                      />
                      <textarea
                        rows={2}
                        placeholder="Answer"
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...form.faqs];
                          next[idx] = { ...next[idx], answer: e.target.value };
                          setForm({ ...form, faqs: next });
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: SEO & Open Graph */}
          {activeTab === 'seo' && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900">Search Engine & Open Graph Metadata</h2>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">SEO Meta Title</label>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {form.seoTitle.length} chars (target 50–60)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    SEO Meta Description
                  </label>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {form.seoDescription.length} chars (target 120–160)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="video downloader, save reels, mp4 converter"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Open Graph (Social Share Card)</h3>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">OG Title</label>
                  <input
                    type="text"
                    required
                    value={form.ogTitle}
                    onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    OG Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={form.ogDescription}
                    onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Open Graph (OG) Image URL
                  </label>
                  <input
                    type="text"
                    value={form.ogImageUrl}
                    onChange={(e) => setForm({ ...form, ogImageUrl: e.target.value })}
                    placeholder="https://savevibe.bond/og-image.png"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </form>
  );
}
