import { describe, expect, it } from "bun:test";
import { normalizeSourceUrl, parseEpisodeNumber, parseLatestChapter } from "./update-checker";

// Minimal Animexin series page: "New Episode" box plus the episode list
function animexinPage(newEpisode: string, items: { num: string; title: string; date: string }[]): string {
    const list = items.map(item => `
        <li><a href="#">
            <div class="epl-num">${item.num}</div>
            <div class="epl-title">${item.title}</div>
            <div class="epl-sub"><span class="status">Sub</span></div>
            <div class="epl-date">${item.date}</div>
        </a></li>`).join("");

    return `
        <div class="lastend">
            <div class="inepcx"><a href="#"><span>First Episode</span><span class="epcur">Episode 1</span></a></div>
            <div class="inepcx"><a href="#"><span>New Episode</span><span class="epcur epcurlast">${newEpisode}</span></a></div>
        </div>
        <div class="eplister"><ul>${list}</ul></div>`;
}

// Minimal asurascans.com series page: canonical link, "First Chapter" button and
// the chapter list (labels contain an HTML comment, as the real page does)
function asuraPage(seriesPath: string, chapters: (number | string)[], extraLinks = ""): string {
    const list = chapters.map(ch => `
        <a href="${seriesPath}/chapter/${ch}" class="group flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="font-medium transition-colors text-white">Chapter <!-- -->${ch}</span>
            </div>
            <span class="block truncate text-white/50 text-sm mt-0.5">Demon Realm War (3)</span>
            <span class="text-sm text-white/40">Oct 16, 2026</span>
        </a>`).join("");

    return `
        <head><link rel="canonical" href="https://asurascans.com${seriesPath}"></head>
        <a href="${seriesPath}/chapter/0"><span data-continue-label>First Chapter</span></a>
        ${extraLinks}
        <div class="divide-y divide-white/5">${list}</div>`;
}

describe("parseLatestChapter", () => {
    it("skips a hiatus announcement and returns the highest numbered episode", () => {
        const html = animexinPage("Episode Hiatus", [
            { num: "Hiatus", title: "Perfect World [Wanmei Shijie] Information!!!", date: "October 1, 2026" },
            { num: "288", title: "Perfect World [Wanmei Shijie] Episode 288 Subtitle", date: "September 25, 2026" },
            { num: "287", title: "Perfect World [Wanmei Shijie] Episode 287 Subtitle", date: "September 18, 2026" },
        ]);
        expect(parseLatestChapter(html)).toBe(288);
    });

    it("uses the cumulative bracketed number from the New Episode box", () => {
        const html = animexinPage("Episode 37 [245]", [
            { num: "37 [245]", title: "Swallowed Star Season 5 Episode 37 [245] Subtitle", date: "October 12, 2026" },
            { num: "36 [244]", title: "Swallowed Star Season 5 Episode 36 [244] Subtitle", date: "October 5, 2026" },
        ]);
        expect(parseLatestChapter(html)).toBe(245);
    });

    it("uses the cumulative bracketed number from the episode list when the box has none", () => {
        const html = animexinPage("Episode Hiatus", [
            { num: "Hiatus", title: "Swallowed Star Season 5 Information", date: "October 19, 2026" },
            { num: "37 [245]", title: "Swallowed Star Season 5 Episode 37 [245] Subtitle", date: "October 12, 2026" },
            { num: "36 [244]", title: "Swallowed Star Season 5 Episode 36 [244] Subtitle", date: "October 5, 2026" },
        ]);
        expect(parseLatestChapter(html)).toBe(245);
    });

    it("reads a regular Animexin episode number", () => {
        const html = animexinPage("Episode 701", [
            { num: "701", title: "Martial Master Episode 701 Subtitle", date: "October 18, 2026" },
        ]);
        expect(parseLatestChapter(html)).toBe(701);
    });

    it("ignores END / End suffixes", () => {
        expect(parseLatestChapter(animexinPage("Episode 20 End", []))).toBe(20);
        expect(parseLatestChapter(animexinPage("Episode Hiatus", [
            { num: "16 END", title: "Martial God Asura Season 2 Episode 16 END", date: "May 2, 2026" },
        ]))).toBe(16);
    });

    it("returns null instead of a date number when there are only announcements", () => {
        const html = animexinPage("Episode Hiatus", [
            { num: "Hiatus", title: "Perfect World [Wanmei Shijie] Information!!!", date: "October 1, 2026" },
        ]);
        expect(parseLatestChapter(html)).toBeNull();
    });

    it("reads the Asura Scans New Chapter box", () => {
        const html = `
            <div class="grid grid-cols-2">
                <a href="#"><h3 class="font-bold">Chapter 1</h3></a>
                <a href="#"><h3 class="font-bold">Chapter 65</h3></a>
            </div>`;
        expect(parseLatestChapter(html)).toBe(65);
    });

    it("reads the latest chapter from an asurascans.com chapter list", () => {
        const html = asuraPage("/comics/solo-max-level-newbie-11fe7da3", [281, 280, 279, 2, 1, 0]);
        expect(parseLatestChapter(html)).toBe(281);
    });

    it("ignores the First Chapter button on an asurascans.com page", () => {
        const html = asuraPage("/comics/goblin-inc-11fe7da3", []);
        expect(parseLatestChapter(html)).toBeNull();
    });

    it("takes the highest Asura chapter even when the list is not sorted", () => {
        const html = asuraPage("/comics/bad-born-blood-11fe7da3", [3, 104, 50]);
        expect(parseLatestChapter(html)).toBe(104);
    });

    it("keeps decimal Asura chapter numbers", () => {
        const html = asuraPage("/comics/return-of-the-mount-hua-sect-11fe7da3", [12, 12.5, 11]);
        expect(parseLatestChapter(html)).toBe(12.5);
    });

    it("ignores chapter links of other series on an Asura series page", () => {
        const html = asuraPage("/comics/goblin-inc-11fe7da3", [18, 17],
            `<a href="/comics/solo-max-level-newbie-11fe7da3/chapter/281"><span class="font-medium">Chapter 281</span></a>`);
        expect(parseLatestChapter(html)).toBe(18);
    });

    it("returns null for the Asura homepage, which lists many series", () => {
        const html = `
            <head><link rel="canonical" href="https://asurascans.com/"></head>
            <a href="/comics/goblin-inc-11fe7da3/chapter/16"><span class="font-medium">Chapter 16</span></a>
            <a href="/comics/solo-max-level-newbie-11fe7da3/chapter/281"><span class="font-medium">Chapter 281</span></a>`;
        expect(parseLatestChapter(html)).toBeNull();
    });

    it("keeps decimal episode numbers", () => {
        expect(parseLatestChapter(animexinPage("Episode 12.5", []))).toBe(12.5);
    });
});

describe("parseEpisodeNumber", () => {
    it("parses common label formats", () => {
        expect(parseEpisodeNumber("288")).toBe(288);
        expect(parseEpisodeNumber("Episode 196")).toBe(196);
        expect(parseEpisodeNumber("Ep. 42")).toBe(42);
        expect(parseEpisodeNumber("Chapter 65")).toBe(65);
        expect(parseEpisodeNumber("78 [208]")).toBe(208);
        expect(parseEpisodeNumber("Perfect World [Wanmei Shijie] Episode 288 Subtitle")).toBe(288);
    });

    it("returns null for labels without an episode number", () => {
        expect(parseEpisodeNumber("Hiatus")).toBeNull();
        expect(parseEpisodeNumber("Episode Hiatus")).toBeNull();
        expect(parseEpisodeNumber("Hiatus Perfect World [Wanmei Shijie] Information!!! Sub October 1, 2026")).toBeNull();
        expect(parseEpisodeNumber("")).toBeNull();
    });
});

describe("normalizeSourceUrl", () => {
    it("rewrites old asuracomic.net series URLs to asurascans.com", () => {
        expect(normalizeSourceUrl("https://asuracomic.net/series/bad-born-blood-3a64143d"))
            .toBe("https://asurascans.com/comics/bad-born-blood-3a64143d");
        expect(normalizeSourceUrl("https://www.asuracomic.net/series/bad-born-blood-3a64143d/"))
            .toBe("https://asurascans.com/comics/bad-born-blood-3a64143d");
    });

    it("leaves other URLs unchanged", () => {
        expect(normalizeSourceUrl("https://asurascans.com/comics/solo-max-level-newbie-0984835a"))
            .toBe("https://asurascans.com/comics/solo-max-level-newbie-0984835a");
        expect(normalizeSourceUrl("https://animexin.dev/martial-god-asura-season-2/"))
            .toBe("https://animexin.dev/martial-god-asura-season-2/");
    });
});
