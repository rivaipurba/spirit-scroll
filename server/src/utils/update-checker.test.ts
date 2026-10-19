import { describe, expect, it } from "bun:test";
import { parseEpisodeNumber, parseLatestChapter } from "./update-checker";

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
