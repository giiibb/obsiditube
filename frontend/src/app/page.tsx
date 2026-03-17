"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ObsidianCardPreview } from "../components/ObsidianCardPreview";
import { NotionCardPreview } from "../components/NotionCardPreview";
import { PaywallModal } from "../components/PaywallModal";
import { useLicense } from "../components/LicenseContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import {
  Youtube,
  Wand2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Github,
  Globe,
  MousePointerClick,
  Search,
  ClipboardCopy,
  Eye,
  Code,
  ClipboardCheck,
  NotebookText,
  BookMarked,
  Zap,
  Lock,
  Star,
  FileJson,
  FileSpreadsheet
} from "lucide-react";

export default function Home() {
  const { licenseKey, isValid, isLoading: licenseLoading } = useLicense();
  const [url, setUrl] = useState("");
  const [cookies, setCookies] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [outputMode, setOutputMode] = useState<"obsidian" | "notion">("obsidian");
  const [loading, setLoading] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [resultAuthor, setResultAuthor] = useState("");
  const [resultMarkdown, setResultMarkdown] = useState("");
  const [resultNotion, setResultNotion] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  
  const cookiesRef = useRef(cookies);
  cookiesRef.current = cookies;
  const licenseKeyRef = useRef(licenseKey);
  licenseKeyRef.current = licenseKey;

  const isPlaylistUrl = (text: string) =>
    /youtube\.com.*[?&]list=/.test(text) || /youtu\.be.*[?&]list=/.test(text);

  const generate = useCallback(async (targetUrl: string, cookieStr?: string) => {
    setLoading(true);
    setResultMarkdown("");
    setResultTitle("");
    setResultAuthor("");
    setTotalCount(0);
    setIsTruncated(false);
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/convert`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-License-Key": licenseKeyRef.current || ""
        },
        body: JSON.stringify({ url: targetUrl, cookies: cookieStr || null }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to convert playlist");
      }
      const data = await res.json();
      setResultTitle(data.title);
      setResultAuthor(data.author || "");
      setResultMarkdown(data.markdown);
      setResultNotion(data.notion || "");
      setTotalCount(data.total_count);
      setIsTruncated(data.truncated);
      
      const count = data.markdown.split("cardlink").length - 1;
      toast.success(
        `Generated ${count} cards from "${data.title}"`
      );
      
      if (data.truncated) {
        toast.info("Playlist truncated to 10 videos (Free Tier limit).", {
          description: "Upgrade to Pro for unlimited access.",
          action: {
            label: "Upgrade",
            onClick: () => setIsPaywallOpen(true)
          }
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!navigator.clipboard?.readText) return;
    navigator.clipboard.readText().then((text) => {
      const trimmed = text.trim();
      if (isPlaylistUrl(trimmed)) {
        setUrl(trimmed);
        toast.info("Playlist URL detected in clipboard — generating...", {
          icon: <ClipboardCheck className="h-4 w-4" />,
          duration: 3000,
        });
        generate(trimmed, cookiesRef.current);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (isPlaylistUrl(newUrl.trim())) {
      generate(newUrl.trim(), cookiesRef.current);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) { toast.error("Please enter a YouTube playlist URL"); return; }
    generate(url, cookies);
  };

  const copyToClipboard = () => {
    const content = outputMode === "notion" ? resultNotion : resultMarkdown;
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast.success("Markdown copied to clipboard!");
  };

  const downloadFile = (format: "md" | "csv" | "json" = "md") => {
    if (!isValid && format !== "md") {
      setIsPaywallOpen(true);
      return;
    }

    let content = outputMode === "notion" ? resultNotion : resultMarkdown;
    let extension = "md";
    let mimeType = "text/markdown";

    if (format === "csv") {
      // Basic CSV generation for cards
      const lines = resultMarkdown.split("cardlink");
      const data = lines.slice(1).map(l => {
        const url = l.match(/url: (.*)/)?.[1] || "";
        const title = l.match(/title: "(.*)"/)?.[1] || "";
        return `"${title.replace(/"/g, '""')}","${url}"`;
      });
      content = "Title,URL\n" + data.join("\n");
      extension = "csv";
      mimeType = "text/csv";
    } else if (format === "json") {
      const lines = resultMarkdown.split("cardlink");
      const data = lines.slice(1).map(l => ({
        url: l.match(/url: (.*)/)?.[1] || "",
        title: l.match(/title: "(.*)"/)?.[1] || ""
      }));
      content = JSON.stringify(data, null, 2);
      extension = "json";
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    const safeName = (s: string) =>
      s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-_]/g, "");
    const playlistPart = safeName(resultTitle) || "playlist";
    const authorPart = resultAuthor ? `_by_${safeName(resultAuthor)}` : "";
    const suffix = outputMode === "notion" ? "_Notion" : "";
    link.download = `ObsidiTube_${playlistPart}_Playlist${authorPart}${suffix}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast.success(`${format.toUpperCase()} Download started!`);
  };

  const COOKIE_STEPS = [
    {
      icon: <Globe className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Open YouTube in your browser",
      detail: "Make sure you're logged in to the account that has access.",
    },
    {
      icon: <MousePointerClick className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Open DevTools",
      detail: "Press F12 or right-click anywhere → Inspect.",
    },
    {
      icon: <Search className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Go to the Network tab",
      detail: 'Refresh. Click on any request to youtube.com. Find the "cookie:" header.',
    },
    {
      icon: <ClipboardCopy className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Copy the entire cookie value",
      detail: "Paste it in the field below.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />

      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Youtube className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight text-lg">
              Obsidi<span className="text-primary">Tube</span>
            </span>
            {isValid && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                Pro
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!isValid && !licenseLoading && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsPaywallOpen(true)}
                className="text-primary hover:text-primary hover:bg-primary/10 font-bold text-xs gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                Upgrade to Pro
              </Button>
            )}
            <a
              href="https://github.com/giiibb/obsiditube"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl pb-24">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4 shadow-[0_0_20px_rgba(200,100,60,0.15)]">
            <Wand2 className="h-4 w-4" />
            <span>Turn playlists into actionable tasks</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white/80 to-white/30 bg-clip-text text-transparent pb-1">
            YouTube to Obsidian
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Convert any YouTube playlist into beautifully formatted Obsidian
            checklist cards. Fast, frictionless, secure.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-white/10 bg-card/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />

              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Configuration
                </CardTitle>
                <CardDescription>
                  Paste a public or unlisted playlist link.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <form onSubmit={handleGenerate} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="url">Playlist URL</Label>
                    <Input
                      id="url"
                      placeholder="https://youtube.com/playlist?list=..."
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="bg-background/50 border-white/10 focus-visible:ring-primary h-12 text-base transition-all"
                      disabled={loading}
                    />
                  </div>

                  {/* Pre-generation Pro Alert */}
                  {!isValid && !licenseLoading && url && isPlaylistUrl(url) && !loading && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-4 w-4 text-primary fill-current animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">Pro Limit Alert</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            This playlist appears to be long. Without Pro, only the first 10 videos will be converted.
                          </p>
                          <button 
                            type="button"
                            onClick={() => setIsPaywallOpen(true)}
                            className="text-xs font-bold text-primary hover:underline mt-1 flex items-center gap-1"
                          >
                            Unlock unlimited access now <Star className="h-3 w-3 fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full"
                  >
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showAdvanced ? "Hide private playlist options" : "Private playlist? Click here"}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="rounded-lg border border-white/10 bg-background/30 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowGuide(!showGuide)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
                        >
                          <span>📖 How to get your cookies</span>
                          {showGuide ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>

                        {showGuide && (
                          <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-200">
                            {COOKIE_STEPS.map((step, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <div className="mt-0.5 flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-[11px] font-bold text-primary flex-shrink-0">
                                  {i + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground leading-tight">{step.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cookies" className="text-muted-foreground flex items-center justify-between">
                          <span>Session Cookies</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider border border-yellow-500/20 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                            Private Only
                          </span>
                        </Label>
                        <Textarea
                          id="cookies"
                          placeholder="Paste the cookie header value here..."
                          value={cookies}
                          onChange={(e) => setCookies(e.target.value)}
                          className="font-mono text-xs bg-background/50 border-white/10 min-h-[80px] resize-none focus-visible:ring-primary"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {resultMarkdown ? (
                    <div className="flex gap-2">
                      <Button type="button" onClick={copyToClipboard} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
                        <Copy className="h-5 w-5 mr-2" /> Copy
                      </Button>
                      <Button type="button" onClick={() => downloadFile("md")} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
                        <Download className="h-5 w-5 mr-2" /> Download
                      </Button>
                      <Button type="submit" variant="outline" size="icon" className="h-12 w-12 border-white/10 bg-background/30" disabled={loading || !url}>
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Wand2 className="h-5 w-5" />}
                      </Button>
                    </div>
                  ) : (
                    <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" disabled={loading || !url}>
                      {loading ? (
                        <span className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Generating...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Wand2 className="h-5 w-5" /> Generate Cards</span>
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {isValid && resultMarkdown && (
              <Card className="border-white/10 bg-card/50 backdrop-blur-md relative overflow-hidden">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary fill-current" />
                    Pro Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 pb-4">
                  <Button variant="outline" size="sm" onClick={() => downloadFile("csv")} className="h-10 border-white/5 bg-white/5 hover:bg-white/10">
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadFile("json")} className="h-10 border-white/5 bg-white/5 hover:bg-white/10">
                    <FileJson className="h-4 w-4 mr-2 text-yellow-500" />
                    Export JSON
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-7 h-[600px] flex flex-col">
            <Card className="flex-1 flex flex-col border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl transition-all">
              <div className="border-b border-white/5 bg-background/50 flex flex-col px-4 pt-2 pb-2 gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                      {resultTitle ? resultTitle : "Output"}
                    </span>
                    {resultTitle && (
                      <span className="flex-shrink-0 text-[10px] font-mono font-semibold tracking-widest text-primary/60 bg-primary/8 border border-primary/15 px-1.5 py-0.5 rounded">
                        .md
                      </span>
                    )}
                  </div>
                  {isTruncated && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      <Lock className="h-3 w-3" />
                      Truncated
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex rounded-md border border-white/10 overflow-hidden mr-1.5">
                    <button
                      onClick={() => setOutputMode("obsidian")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${outputMode === "obsidian" ? "bg-primary text-primary-foreground" : "bg-background/30 text-muted-foreground hover:text-foreground"}`}
                    >
                      <BookMarked className="h-3.5 w-3.5" /> Obsidian
                    </button>
                    <button
                      onClick={() => setOutputMode("notion")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${outputMode === "notion" ? "bg-[#ffffff] text-[#191919]" : "bg-background/30 text-muted-foreground hover:text-foreground"}`}
                    >
                      <NotebookText className="h-3.5 w-3.5" /> Notion
                    </button>
                  </div>

                  <div className="flex rounded-md border border-white/10 overflow-hidden mr-1.5">
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "bg-background/30 text-muted-foreground hover:text-foreground"}`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => setViewMode("code")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === "code" ? "bg-primary text-primary-foreground" : "bg-background/30 text-muted-foreground hover:text-foreground"}`}
                    >
                      <Code className="h-3.5 w-3.5" /> Code
                    </button>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 border-white/10 bg-background/30 hover:bg-primary hover:text-primary-foreground" onClick={copyToClipboard} disabled={!resultMarkdown}>
                    <Copy className="h-4 w-4 mr-1.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 border-white/10 bg-background/30 hover:bg-primary hover:text-primary-foreground" onClick={() => downloadFile("md")} disabled={!resultMarkdown}>
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative bg-[#0a0a0a] overflow-y-auto">
                {isTruncated && (
                  <div className="sticky top-0 z-20 w-full px-4 py-3 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 backdrop-blur-md border-b border-primary/20 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-bounce">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white tracking-wide">
                          {totalCount - 10} MORE VIDEOS LOCKED
                        </p>
                        <p className="text-[10px] text-primary/80 font-medium">
                          You&apos;re using the Free Tier (limit: 10)
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setIsPaywallOpen(true)}
                      className="h-8 px-4 bg-primary text-white font-bold text-xs gap-1.5 hover:scale-105 transition-transform"
                    >
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      Unlock Pro — $9
                    </Button>
                  </div>
                )}

                {!resultMarkdown ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 select-none">
                    <Youtube className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Ready when you are</p>
                    <p className="text-sm">Your markdown will appear here</p>
                  </div>
                ) : viewMode === "code" ? (
                  <ScrollArea className="h-full w-full absolute inset-0">
                    <div className="p-4 md:p-6 pb-12 w-full min-h-full">
                      <pre className="text-sm font-mono leading-relaxed text-[#e5e5e5] whitespace-pre-wrap break-words">
                        {outputMode === "notion" ? resultNotion : resultMarkdown}
                      </pre>
                    </div>
                  </ScrollArea>
                ) : outputMode === "notion" ? (
                  <ScrollArea className="h-full w-full absolute inset-0">
                    <NotionCardPreview notion={resultNotion} />
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-full w-full absolute inset-0">
                    <ObsidianCardPreview markdown={resultMarkdown} />
                  </ScrollArea>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-12 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="opacity-20">|</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="opacity-20">|</span>
            <a href="/refund" className="hover:text-primary transition-colors">Refund Policy</a>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© 2026 GiBlok. Built with</span>
            <span className="text-primary">♥</span>
            <span>for the Obsidian community.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Loader2(props: React.SVG_Props<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
