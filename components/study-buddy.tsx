"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, LoaderCircle, X } from "lucide-react";
import { getCourses } from "@/server-functions/course";

type BuddyKind = "course" | "product" | "article";

type BuddyCourse = {
  title: string;
  slug: string;
  description?: string;
};

type ActionFamily = "hop" | "double-hop" | "hang" | "peek" | "spin" | "walk" | "wave" | "point" | "lift" | "wobble";

type BuddyAction = {
  id: number;
  family: ActionFamily;
  variation: number;
  line: string;
};

type RoamingState = {
  left: number;
  top: number;
  bubbleSide: "left" | "right";
  bubbleOffset: number;
  kind: BuddyKind;
  title: string;
  href: string;
  actionId: number;
  line: string;
};

const actionFamilies: ActionFamily[] = ["hop", "double-hop", "hang", "peek", "spin", "walk", "wave", "point", "lift", "wobble"];

const actionLines = [
  "Is course par jump maaro—yahan se shuru karo!",
  "Ye wali class tumhare next step mein kaam aa sakti hai.",
  "Exam prep? Is course ko dekho!",
  "Ek chhota lesson, ek nayi skill—try this.",
  "Yeh course tumhari reading list mein fit ho sakta hai.",
  "Is topic ko step by step samjho!",
  "Chalo, agla concept yahan se pakdein?",
  "Is course ke lessons ek baar browse karo.",
  "Useful lag raha? Card kholo aur dekho.",
  "Yahan se apni learning ko aage badhao.",
  "Main latak raha hoon—course details dekho!",
  "Is card ke andar course ka overview hai.",
  "Read this next? Is path ka intro dekho.",
  "Yahan useful lessons mil sakte hain.",
  "Ek baar syllabus check kar lena!",
  "Psst… is course par nazar daalo!",
  "Yeh topic explore karna chahoge?",
  "Is course ko apni study list mein rakho.",
  "Yahan se concept clear ho sakta hai.",
  "Course card par tap karke details padho.",
  "Learning ka next turn? Yeh raha!",
  "Is course ke saath naya topic explore karo.",
  "Yeh dekho, ek aur study path!",
  "Is path ko open karke dekhna.",
  "Thoda explore karein? Yeh course yahan hai.",
  "Is course ki taraf slide karo!",
  "Is topic ke lessons browse karo.",
  "Yeh course tumhare goal se match kar sakta hai.",
  "Next, is course ka overview padho.",
  "Is skill ko yahan se start kar sakte ho.",
  "Hi! Yeh course tumhare liye ek idea hai.",
  "Course par click karke details dekho!",
  "Yeh wala course try karoge?",
  "Shayad yeh padhne layak ho!",
  "Is course ka intro padho, phir decide karo.",
  "Idhar dekho—course details yahan hain!",
  "Is course ke lessons ko ek nazar dekho.",
  "Yeh card open karo, syllabus padh lo.",
  "Course details check karna mat bhoolna.",
  "Peek karo—andar kya seekhoge dekho.",
  "Main yahan baithkar tumhara wait kar raha tha!",
  "Thoda waqt? Is course ka intro dekh lo.",
  "Yeh path apni pace par explore karo.",
  "Chalo, aaj ek topic explore karte hain.",
  "Is course se tumhari study shuru ho sakti hai.",
  "Main climb karke yahan aaya—yeh dekho!",
  "Is card ke andar next lesson chhupa hai!",
  "Course kholkar apna next step chuno.",
  "Learning path ready hai—details kholo!",
  "Upar dekho, tumhara agla course yahan hai!",
] as const;

const itemPrompts: Record<BuddyKind, readonly string[]> = {
  course: actionLines,
  product: [
    "Is resource ko dekh rahe ho? Download details dikhaun?",
    "Tum ise apni library mein rakhna chahoge?",
    "Yeh product tumhara waqt bacha sakta hai—check karein?",
    "Price ya free access dekh liya? Main details kholun?",
    "Ismein kya milega, jaan na hai?",
    "Study notes ya template dhoondh rahe ho?",
    "Kya isi type ka resource chahiye?",
    "Baad mein library se bhi khol sakte ho—abhi dekhein?",
    "Is download ko pick karun?",
    "Kya main product details kholun?",
    "Yeh resource tumhare kaam ka lag raha hai?",
    "Iske andar ka preview dekhna chahoge?",
    "Ek click mein is download ki poori jaankari mil jayegi.",
    "Kya tumhe exam ke liye notes chahiye?",
    "Yeh tool tumhara next task aasaan kar sakta hai.",
    "Is product ko compare karna hai ya seedha dekhna hai?",
    "Free resource dhoondh rahe ho? Isko check karein?",
    "Kya isse tumhari preparation tez ho sakti hai?",
    "Main ise tumhare liye khol kar dikhaun?",
    "Iski file aur access details dekhni hain?",
    "Kya tum ise apni saved library mein rakhoge?",
    "Yeh notes tumhare course ke saath fit ho sakte hain.",
    "Resource pasand aaya? Details ek baar dekh lo.",
    "Kisi specific format ki talaash hai?",
    "Chalo, is download ko thoda explore karein?",
    "Is product mein tumhari zaroorat wali cheez ho sakti hai.",
    "Kya tumhe is topic ka ready-made material chahiye?",
    "Ek nazar is resource ke contents par daaloge?",
    "Iski price aur features saath mein check kar lein?",
    "Main yahin hoon—product kholna ho to batao!",
  ],
  article: [
    "Is article par ruk gaye? Iska short guide kholun?",
    "Yeh topic padhna chahoge ya baad ke liye save karna?",
    "Tumhare sawaal ka jawab is article mein ho sakta hai.",
    "Is guide mein seedhe practical steps milenge.",
    "Ek chhota read karein? Main yahin saath hoon.",
    "Kya tum is topic ko aur clearly samajhna chahte ho?",
    "Is article mein ek useful idea tumhara intezaar kar raha hai.",
    "Kis point par atke ho? Yeh guide help kar sakti hai.",
    "Nayi tip chahiye? Is page par dekh lo!",
    "Chalo, is article ka pehla hissa saath padhte hain?",
    "Yeh walkthrough tumhare agle step mein kaam aa sakta hai.",
    "Is topic par aur detail chahiye?",
    "Kya tum ek quick explanation dhoondh rahe ho?",
    "Is guide ko open karke apni pace se padho.",
    "Yeh article tumhare current course se related hai.",
    "Ismein examples bhi hain—dekhna pasand karoge?",
    "Kya main tumhe is article tak le chalun?",
    "Ek minute mein useful tip mil sakti hai.",
    "Is title ne tumhara dhyaan khincha? Andar dekhein?",
    "Padhne ke liye ek aur practical walkthrough!",
    "Kya tum is idea ko apne project mein use karoge?",
    "Yeh article confusion ko step-by-step clear kar sakta hai.",
    "Main heading aur key points dikhaun?",
    "Is topic par aur kuchh explore karna hai?",
    "Chalo, ek chhota concept aur seekh lete hain!",
    "Is guide mein tumhare kaam ka answer ho sakta hai.",
    "Abhi padhna hai ya main agla option dikhaun?",
    "Yeh article save-worthy lag raha hai—kholo?",
    "Kya tum ise apni reading list mein rakhna chahoge?",
    "Main tumhare saath hoon—article dekhna ho to tap karo!",
  ],
};

const activityPrompts: Record<BuddyKind, Record<"hover" | "leave" | "search" | "scroll", readonly string[]>> = {
  course: {
    hover: ["Isi course par nazar hai? Syllabus kholun?", "Ruk gaye yahan—kya yeh tumhara next course ho?", "Course pasand aaya? Main andar ka raasta dikhaun?", "Is path ke lessons dekhna chahoge?", "Tum is course ko compare kar rahe ho?"],
    leave: ["Aur options bhi hain—aaram se dekh lo.", "Koi baat nahi, main agle course par chalta hoon.", "Wapas aana ho to yeh course yahin milega.", "Kya kisi aur topic ka course dhoondhein?", "Main paas hi hoon, explore karte raho!"],
    search: ["Koi specific course dhoondh rahe ho? Search mein likho!", "Topic batao—main matching learning path dhoondhne mein madad karun?", "Kis skill par focus karna hai?", "Course ka naam ya subject type karoge?", "Search karo, phir main result par jump karunga!"],
    scroll: ["Niche aur learning paths hain—main saath aa raha hoon!", "Tum explore kar rahe ho—agla course dikhata hoon.", "Scroll karte raho, main cards par chalta hoon!", "Koi topic nazar aaya jo pasand ho?", "Main next visible course par aa gaya!"],
  },
  product: {
    hover: ["Is resource par ruk gaye? Details dikhaun?", "Tum is download ko dekh rahe ho—kholun?", "Kya yahi tool tum dhoondh rahe the?", "Price aur contents check karna hai?", "Is resource ko library mein rakhna chahoge?"],
    leave: ["Aur resources bhi hain—main aage dekhta hoon.", "Koi baat nahi, apni pace se browse karo.", "Wapas aana ho to main ise yaad rakhunga.", "Kisi aur format ka resource chahiye?", "Main doosre downloads bhi dikha deta hoon!"],
    search: ["Koi particular resource chahiye? Search karo!", "Notes, template ya topic likho—main dhoondhne mein saath hoon.", "Free download dhoondh rahe ho?", "Kis course ke liye material chahiye?", "Search karo, phir matching resource par chalte hain!"],
    scroll: ["Aur resources dekhne chalte hain!", "Tum browse kar rahe ho—agla download dikhata hoon.", "Scroll karo, shayad tumhara kaam ka tool aage ho.", "Koi resource pasand aaya? Main yahin hoon.", "Main next visible product tak aa raha hoon!"],
  },
  article: {
    hover: ["Isi article ko padhna chahte ho?", "Title par ruk gaye—guide kholun?", "Kya is topic par thoda aur padhna hai?", "Yeh article tumhare kaam aa sakta hai!", "Main is article ka darwaza kholun?"],
    leave: ["Aur articles bhi hain—main aage dekhta hoon.", "Koi baat nahi, apni pace se padh lo.", "Baad mein wapas aana, main yahin milunga.", "Kisi aur topic ki guide dhoondhein?", "Chalo, agla article bhi dekh lete hain!"],
    search: ["Kis topic par article dhoondh rahe ho?", "Ek keyword likho—matching guide dhoondhte hain!", "Quick answer ya detailed tutorial chahiye?", "Search karo, main result par hop karunga.", "Kya kisi specific sawaal ka jawab chahiye?"],
    scroll: ["Aur padhne layak guides aa rahi hain!", "Tum explore kar rahe ho—agla article dikhata hoon.", "Niche aur ideas hain, chalte hain!", "Koi title pasand aaya? Main kholne ko ready hoon.", "Main next article card tak chal kar aa raha hoon!"],
  },
};

const buddyActions: BuddyAction[] = actionLines.map((line, id) => ({
  id,
  family: actionFamilies[Math.floor(id / 5)],
  variation: id % 5,
  line,
}));

function courseSummary(description?: string) {
  const clean = String(description || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 72 ? `${clean.slice(0, 69).trimEnd()}…` : clean;
}

function BuddyCharacter({ family }: { family?: ActionFamily }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className={`study-buddy-sprite study-buddy-float h-12 w-12 text-primary ${family ? `study-buddy--${family}` : ""}`}
      aria-hidden="true"
    >
      <path className="study-buddy-cap" d="m36 3 19 8-19 8-19-8 19-8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M22 14v6c8 4 20 4 28 0v-6M54 12v10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3">
        <path className="study-buddy-arm-left" d="M19 38c-5-4-9 0-10 6" />
        <path className="study-buddy-arm-right" d="M53 38c5-4 9 0 10 6" />
        <path className="study-buddy-leg-left" d="m28 57c-2 2-4 5-3 8" />
        <path className="study-buddy-leg-right" d="m44 57c2 2 4 5 3 8" />
      </g>
      <path className="study-buddy-cover study-buddy-cover-left" d="M17 22c7-4 13-3 19 1v34c-6-4-12-5-19-2V22Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.5" />
      <path className="study-buddy-cover study-buddy-cover-right" d="M36 23c6-4 12-5 19-1v33c-7-3-13-2-19 2V23Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M36 23v34" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      <g className="study-buddy-blink" fill="currentColor">
        <circle cx="30" cy="37" r="1.8" />
        <circle cx="42" cy="37" r="1.8" />
      </g>
      <g className="study-buddy-blush">
        <ellipse cx="25" cy="42" rx="2.6" ry="1.5" />
        <ellipse cx="47" cy="42" rx="2.6" ry="1.5" />
      </g>
      <path d="M32.5 43c2 2 5 2 7 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function actionKeyframes(action: BuddyAction): Keyframe[] {
  const side = action.variation % 2 === 0 ? -1 : 1;
  const height = 26 + action.variation * 6;
  const tilt = side * (10 + action.variation * 7);
  const pose = (x: number, y: number, rotate: number, scale = 1): Keyframe => ({
    transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
  });

  switch (action.family) {
    case "hop":
      return [pose(0, 0, 0), pose(side * 8, -height, tilt, 0.88), pose(side * 12, 1, -tilt / 2, 1.12), pose(0, 0, 0)];
    case "double-hop":
      return [pose(0, 0, 0), pose(0, -height, tilt, 0.9), pose(0, 0, 0.0, 1.08), pose(side * 7, -height * 0.7, -tilt, 0.92), pose(0, 0, 0)];
    case "hang":
      return [pose(0, 0, 0), pose(0, 8, side * 72, 0.96), pose(side * 4, 22, side * 98, 0.92), pose(side * 3, 21, side * 92, 0.94)];
    case "peek":
      return [pose(side * 20, 3, side * 12, 0.72), pose(side * 5, 0, 0, 0.94), pose(side * 18, 2, -side * 8, 0.78), pose(0, 0, 0)];
    case "spin":
      return [pose(0, 0, 0), pose(side * 8, -height * 0.55, side * (180 + action.variation * 90), 0.92), pose(0, 0, side * 360, 1)];
    case "walk":
      return [pose(-side * 5, 0, -side * 5, 0.98), pose(side * 4, -4, side * 5, 1.02), pose(side * 7, 0, side * 8, 1), pose(0, 0, 0)];
    case "wave":
      return [pose(0, 0, 0), pose(0, -height * 0.45, side * 14, 1.05), pose(0, -height * 0.35, -side * 12, 1), pose(0, 0, 0)];
    case "point":
      return [pose(side * 8, 3, -side * 18, 0.98), pose(side * 15, -height * 0.3, -side * 24, 1.04), pose(side * 8, 2, -side * 12, 1)];
    case "lift":
      return [pose(0, 8, 0, 0.94), pose(0, -4, -side * 8, 1.02), pose(side * 3, -height * 0.55, side * 8, 1.04), pose(0, 0, 0)];
    case "wobble":
      return [pose(0, 0, -side * 8, 1), pose(side * 4, 1, side * 9, 0.98), pose(-side * 3, -1, -side * 5, 1.02), pose(0, 0, 0)];
  }
}

function shuffleActions(queue: number[]) {
  for (let index = queue.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [queue[index], queue[swapIndex]] = [queue[swapIndex], queue[index]];
  }
}

function isBuddyKind(value: string | undefined): value is BuddyKind {
  return value === "course" || value === "product" || value === "article";
}

export default function StudyBuddy() {
  const pathname = usePathname();
  const router = useRouter();
  const isRoamingPage = pathname === "/" || pathname === "/courses" || pathname === "/products" || pathname === "/blogs";
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<BuddyCourse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [tour, setTour] = useState<RoamingState | null>(null);
  const [lifting, setLifting] = useState(false);
  const characterRef = useRef<HTMLDivElement>(null);
  const roamingPositionRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const tourRef = useRef<RoamingState | null>(null);
  const actionQueueRef = useRef<number[]>([]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!isRoamingPage || tourDismissed || open) return;
    let frame = 0;
    let followFrame = 0;
    let idleLiftTimer = 0;
    let idleLiftAnimation: Animation | null = null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateTour = (nextTour: RoamingState | null) => {
      tourRef.current = nextTour;
      setTour(nextTour);
    };

    const clearIdleLift = () => {
      if (idleLiftTimer) window.clearTimeout(idleLiftTimer);
      idleLiftAnimation?.cancel();
      idleLiftTimer = 0;
      idleLiftAnimation = null;
    };

    const scheduleIdleLift = (element: HTMLElement) => {
      clearIdleLift();
      if (prefersReducedMotion || element.matches(":hover")) return;
      idleLiftTimer = window.setTimeout(() => {
        if (targetElementRef.current !== element || document.visibilityState !== "visible") return;
        setLifting(true);
        idleLiftAnimation = element.animate([
          { transform: "translateY(0) scale(1)" },
          { transform: "translateY(-12px) scale(1.01)", offset: 0.18 },
          { transform: "translateY(-26px) scale(1.025)", offset: 0.55 },
          { transform: "translateY(-14px) scale(1.015)", offset: 0.82 },
          { transform: "translateY(0) scale(1)" },
        ], { duration: 1050, easing: "ease-in-out" });
        idleLiftAnimation.onfinish = () => {
          idleLiftAnimation = null;
          setLifting(false);
        };
      }, 3200);
    };

    const nextAction = () => {
      if (actionQueueRef.current.length === 0) {
        actionQueueRef.current = buddyActions.map((action) => action.id);
        shuffleActions(actionQueueRef.current);
      }
      return actionQueueRef.current.pop() ?? 0;
    };

    const visibleCards = () => Array.from(document.querySelectorAll<HTMLElement>("[data-study-buddy-item]"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.bottom > 72 && rect.top < window.innerHeight - 40;
      });

    const bubblePlacementFor = (left: number) => {
      const fitsRight = left + 48 + 176 < window.innerWidth - 8;
      const bubbleLeft = fitsRight
        ? left + 48
        : Math.max(8, Math.min(left - 176, window.innerWidth - 184));
      return {
        bubbleSide: fitsRight ? "right" as const : "left" as const,
        bubbleOffset: bubbleLeft - left,
      };
    };

    const showActivityPrompt = (kind: BuddyKind, activity: keyof typeof activityPrompts.course) => {
      const currentTour = tourRef.current;
      if (!currentTour) return;
      const options = activityPrompts[kind][activity];
      updateTour({ ...currentTour, line: options[Math.floor(Math.random() * options.length)] });
    };

    const placeOnCard = (element: HTMLElement, actionId: number, reaction?: string) => {
      const rect = element.getBoundingClientRect();
      const left = Math.max(8, Math.min(window.innerWidth - 60, rect.left + rect.width * 0.68 - 24));
      const top = Math.max(88, Math.min(window.innerHeight - 72, rect.top - 24));
      const href = element.dataset.studyBuddyHref;
      const kind = element.dataset.studyBuddyKind;
      if (!href || !isBuddyKind(kind)) return;
      const bubblePlacement = bubblePlacementFor(left);
      const line = itemPrompts[kind][actionId % itemPrompts[kind].length];

      targetElementRef.current = element;
      updateTour({
        left,
        top,
        ...bubblePlacement,
        kind,
        title: element.dataset.studyBuddyTitle || "Explore this",
        href,
        actionId,
        line: reaction || line,
      });
      setLifting(false);
      scheduleIdleLift(element);
    };

    const chooseNextCard = () => {
      const cards = visibleCards();
      if (cards.length === 0) {
        clearIdleLift();
        setLifting(false);
        targetElementRef.current = null;
        updateTour(null);
        return;
      }

      const currentIndex = cards.indexOf(targetElementRef.current as HTMLElement);
      const nextIndex = (currentIndex + 1) % cards.length;
      placeOnCard(cards[nextIndex], nextAction());
    };

    const refreshPosition = () => {
      const cards = visibleCards();
      if (cards.length === 0) {
        clearIdleLift();
        setLifting(false);
        targetElementRef.current = null;
        updateTour(null);
        return;
      }

      const currentTarget = targetElementRef.current;
      if (currentTarget && cards.includes(currentTarget)) {
        const rect = currentTarget.getBoundingClientRect();
        const left = Math.max(8, Math.min(window.innerWidth - 60, rect.left + rect.width * 0.68 - 24));
        const top = Math.max(88, Math.min(window.innerHeight - 72, rect.top - 24));
        if (roamingPositionRef.current) {
          roamingPositionRef.current.style.left = `${left}px`;
          roamingPositionRef.current.style.top = `${top}px`;
        }
        const currentTour = tourRef.current;
        const bubblePlacement = bubblePlacementFor(left);
        if (currentTour && (
          currentTour.bubbleSide !== bubblePlacement.bubbleSide ||
          currentTour.bubbleOffset !== bubblePlacement.bubbleOffset
        )) {
          updateTour({ ...currentTour, left, top, ...bubblePlacement });
        }
        return;
      }
      if (!currentTarget || !cards.includes(currentTarget)) {
        clearIdleLift();
        chooseNextCard();
      }
    };

    const followPointer = (event: PointerEvent) => {
      if (prefersReducedMotion) return;
      if (event.target instanceof Element && event.target.closest(".study-buddy-bubble")) {
        roamingPositionRef.current?.style.setProperty("transform", "translate3d(0, 0, 0)");
        return;
      }
      if (followFrame) return;
      const pointerX = event.clientX;
      const pointerY = event.clientY;
      followFrame = window.requestAnimationFrame(() => {
        followFrame = 0;
        const element = roamingPositionRef.current;
        if (!element) return;
        const card = targetElementRef.current;
        const rect = card?.getBoundingClientRect();
        const anchorX = rect ? rect.left + rect.width * 0.68 : window.innerWidth / 2;
        const anchorY = rect ? rect.top : window.innerHeight / 2;
        const x = Math.max(-12, Math.min(12, (pointerX - anchorX) * 0.035));
        const y = Math.max(-8, Math.min(8, (pointerY - anchorY) * 0.025));
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    const reactToItemHover = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>("[data-study-buddy-item]");
      if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;
      const kind = item.dataset.studyBuddyKind;
      if (!isBuddyKind(kind)) return;
      clearIdleLift();
      setLifting(false);
      if (item === targetElementRef.current) {
        showActivityPrompt(kind, "hover");
      } else {
        const options = activityPrompts[kind].hover;
        placeOnCard(item, nextAction(), options[Math.floor(Math.random() * options.length)]);
      }
    };

    const reactToItemLeave = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>("[data-study-buddy-item]");
      if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;
      const kind = item.dataset.studyBuddyKind;
      if (item === targetElementRef.current && isBuddyKind(kind)) {
        showActivityPrompt(kind, "leave");
        scheduleIdleLift(item);
      }
    };

    const handleSearchActivity = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== "search") return;
      const kind: BuddyKind = pathname === "/products" ? "product" : pathname === "/blogs" ? "article" : "course";
      showActivityPrompt(kind, "search");
    };

    const scheduleRefresh = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(refreshPosition);
    };

    let lastScrollPromptAt = 0;
    const handleScroll = () => {
      scheduleRefresh();
      const currentTour = tourRef.current;
      if (!currentTour || Date.now() - lastScrollPromptAt < 1600) return;
      lastScrollPromptAt = Date.now();
      showActivityPrompt(currentTour.kind, "scroll");
    };

    window.addEventListener("resize", scheduleRefresh);
    window.addEventListener("pointermove", followPointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("pointerover", reactToItemHover);
    document.addEventListener("pointerout", reactToItemLeave);
    document.addEventListener("focusin", handleSearchActivity);
    document.addEventListener("input", handleSearchActivity);
    const cardObserver = new MutationObserver(scheduleRefresh);
    cardObserver.observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
    const firstAppearance = window.setTimeout(chooseNextCard, 900);
    const actionTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") chooseNextCard();
    }, 7200);

    return () => {
      window.removeEventListener("scroll", scheduleRefresh);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleRefresh);
      window.removeEventListener("pointermove", followPointer);
      document.removeEventListener("pointerover", reactToItemHover);
      document.removeEventListener("pointerout", reactToItemLeave);
      document.removeEventListener("focusin", handleSearchActivity);
      document.removeEventListener("input", handleSearchActivity);
      cardObserver.disconnect();
      clearIdleLift();
      window.clearTimeout(firstAppearance);
      window.clearInterval(actionTimer);
      if (frame) window.cancelAnimationFrame(frame);
      if (followFrame) window.cancelAnimationFrame(followFrame);
    };
  }, [isRoamingPage, open, pathname, tourDismissed]);

  useEffect(() => {
    if (!isRoamingPage) return;

    const handleCardClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>("[data-study-buddy-item]");
      if (!item) return;
      const href = item.dataset.studyBuddyHref;
      if (!href || !href.startsWith("/") || href.startsWith("//") || !isBuddyKind(item.dataset.studyBuddyKind)) return;
      if (event.target.closest("a, button, input, select, textarea, [role='button']")) return;

      event.preventDefault();
      event.stopPropagation();
      router.push(href);
    };

    document.addEventListener("click", handleCardClick, true);
    return () => document.removeEventListener("click", handleCardClick, true);
  }, [isRoamingPage, router]);

  const actionId = tour?.actionId;

  useEffect(() => {
    const character = characterRef.current;
    if (actionId === undefined || !character || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const action = buddyActions[actionId];
    character.style.transformOrigin = action.family === "hang" ? "top center" : "center";
    const animation = character.animate(actionKeyframes(action), {
      duration: 1050 + action.variation * 90,
      easing: "cubic-bezier(.2,.8,.2,1)",
      fill: "none",
    });
    return () => {
      animation.cancel();
      character.style.transformOrigin = "center";
    };
  }, [actionId]);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/chat")
  ) return null;

  const loadCourses = async () => {
    if (courses !== null || loading) return;
    setLoading(true);
    setLoadError(false);
    try {
      const result = await getCourses({ skip: 0, postsPerPage: 2 });
      if ("error" in result) {
        console.error("Study Buddy could not load course picks", result.error);
        setLoadError(true);
        return;
      }
      setCourses(result.courses.map(({ title, slug, description }) => ({ title, slug, description })));
    } catch (error) {
      console.error("Study Buddy could not load course picks", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleBuddy = () => {
    if (!open) void loadCourses();
    setOpen((current) => !current);
  };

  const roaming = isRoamingPage && !tourDismissed && !open && tour;

  return (
    <>
      {roaming ? (
        <div
          ref={roamingPositionRef}
          className="pointer-events-none fixed z-[60]"
          style={{
            left: roaming.left,
            top: roaming.top,
            transition: "left 650ms cubic-bezier(.2,.8,.2,1), top 650ms cubic-bezier(.2,.8,.2,1), transform 180ms ease-out",
          }}
        >
          <div
            ref={characterRef}
            className="study-buddy-character"
            data-family={lifting ? "lift" : buddyActions[roaming.actionId].family}
            aria-hidden="true"
          >
            <BuddyCharacter family={lifting ? "lift" : buddyActions[roaming.actionId].family} />
          </div>
          <div
            className="study-buddy-bubble pointer-events-auto absolute top-0 w-44 rounded-xl border bg-popover/95 p-2.5 text-popover-foreground shadow-lg backdrop-blur"
            aria-live="polite"
            style={{ left: roaming.bubbleOffset }}
          >
            <div className="flex items-start gap-1">
              <p className="flex-1 text-[10px] font-medium leading-4">{roaming.line}</p>
              <button
                type="button"
                onClick={() => {
                  setTourDismissed(true);
                  targetElementRef.current = null;
                  tourRef.current = null;
                  setTour(null);
                }}
                aria-label="Hide the moving Study Buddy"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X size={12} />
              </button>
            </div>
            <Link
              href={roaming.href}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
            >
              <span className="line-clamp-1">{roaming.title}</span>
              <ArrowRight size={12} className="shrink-0" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
        {open && !roaming ? (
          <section
            id="study-buddy-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="study-buddy-title"
            className="max-h-[min(48dvh,22rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl shadow-black/15"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BuddyCharacter />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="study-buddy-title" className="text-sm font-semibold">Hi, I’m your Study Buddy</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Find a learning path for your next step.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close Study Buddy"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-2" aria-live="polite">
              {loading ? (
                <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  <LoaderCircle size={14} className="animate-spin" /> Finding a few courses…
                </p>
              ) : null}
              {loadError ? (
                <div className="rounded-xl bg-muted/60 p-3 text-xs">
                  <p className="text-muted-foreground">Course picks could not load right now.</p>
                  <button type="button" onClick={() => void loadCourses()} className="mt-2 font-medium text-primary hover:underline">
                    Try again
                  </button>
                </div>
              ) : null}
              {courses?.length ? courses.map((course) => (
                <Link
                  key={course.slug}
                  href={`/course/${course.slug}`}
                  onClick={() => setOpen(false)}
                  className="group block rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1 text-xs font-semibold group-hover:text-primary">{course.title}</span>
                    <ArrowRight size={14} className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">
                    {courseSummary(course.description) || "A focused course to help you take your next learning step."}
                  </span>
                </Link>
              )) : null}
              {courses && courses.length === 0 ? (
                <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  New course picks are on the way. Browse all courses to find your next topic.
                </p>
              ) : null}
            </div>

            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Browse all courses <ArrowRight size={13} />
            </Link>
          </section>
        ) : null}

        {!roaming ? (
          <button
            type="button"
            onClick={toggleBuddy}
            aria-label="Toggle Study Buddy"
            aria-controls="study-buddy-panel"
            aria-expanded={open}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {open ? <BookOpen size={20} aria-hidden="true" /> : <BuddyCharacter />}
          </button>
        ) : null}
      </div>
    </>
  );
}
