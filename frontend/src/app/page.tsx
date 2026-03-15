"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from "sonner";
import { Youtube, Wand2, Copy, Download, Settings2, Github } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [cookies, setCookies] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [resultMarkdown, setResultMarkdown] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a YouTube playlist URL");
      return;
    }

    setLoading(true);
    setResultMarkdown("");
    setResultTitle("");

    try {
      const res = await fetch("http://localhost:8000/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, cookies: cookies || null }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to convert playlist");
      }

      const data = await res.json();
      setResultTitle(data.title);
      setResultMarkdown(data.markdown);
      toast.success("Successfully generated Obsidian cards!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!resultMarkdown) return;
    navigator.clipboard.writeText(resultMarkdown);
    toast.success("Copied to clipboard!");
  };

  const downloadFile = () => {
    if (!resultMarkdown) return;
    const blob = new Blob([resultMarkdown], { type: "text/markdown" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    const safeTitle = resultTitle ? resultTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'playlist';
    link.download = `${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast.success("Download started!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Toaster theme="dark" position="top-center" richColors />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Youtube className="h-6 w-6" />
            <span className="font-bold tracking-wider text-lg text-foreground">
              YT<span className="text-primary">2</span>OBSIDIAN
            </span>
          </div>
          <a
            href="https://github.com/thefcraft/youtube-playlist-to-obsidian-cards"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4 shadow-[0_0_20px_var(--color-primary)] opacity-90">
            <Wand2 className="h-4 w-4" />
            <span>Turn playlists into actionable tasks</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent pb-1">
            YouTube to Obsidian
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Convert any YouTube playlist into beautifully formatted Obsidian checklist cards, instantly. Fast, frictionless, and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Section */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-white/10 bg-card/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 transition-opacity"></div>
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Configuration</span>
                </CardTitle>
                <CardDescription>
                  Paste your playlist link below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <Label htmlFor="url">Playlist URL</Label>
                    <Input
                      id="url"
                      placeholder="https://youtube.com/playlist?list=..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-background/50 border-white/10 focus-visible:ring-primary h-12 text-md transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                      {showAdvanced ? "Hide advanced options" : "Advanced options"}
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="cookies" className="text-muted-foreground flex items-center justify-between">
                          <span>Session Cookies</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider border border-yellow-500/20 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Private Playlists</span>
                        </Label>
                        <Textarea
                          id="cookies"
                          placeholder="PASTE_YOUR_YOUTUBE_COOKIE_HEADER_HERE"
                          value={cookies}
                          onChange={(e) => setCookies(e.target.value)}
                          className="font-mono text-xs bg-background/50 border-white/10 min-h-[100px] resize-none focus-visible:ring-primary"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Need to convert a private playlist? Open DevTools on YouTube, go to the Network tab, inspect a request, and copy the <code className="text-primary bg-primary/10 px-1 rounded">cookie</code> header value.
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02]"
                    disabled={loading || !url}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Generating Magic...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Generate Cards
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 h-[600px] flex flex-col">
            <Card className="flex-1 flex flex-col border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl transition-all">
              <div className="h-14 border-b border-white/5 bg-background/50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground ml-2 truncate max-w-[200px] sm:max-w-xs">
                    {resultTitle ? `${resultTitle}.md` : "Output"}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/10 bg-background/30 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all"
                    onClick={copyToClipboard}
                    disabled={!resultMarkdown}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/10 bg-background/30 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all"
                    onClick={downloadFile}
                    disabled={!resultMarkdown}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 relative bg-[#0a0a0a]">
                {!resultMarkdown ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 select-none">
                    <Youtube className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Ready when you are</p>
                    <p className="text-sm">Your markdown will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-full w-full absolute inset-0">
                    <div className="p-4 md:p-6 pb-12 w-full min-h-full">
                      <pre className="text-sm font-mono leading-relaxed text-[#e5e5e5] whitespace-pre-wrap break-words">
                        {resultMarkdown}
                      </pre>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
