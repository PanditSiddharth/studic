"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { BlogCard, CourseCard } from "@/components/Cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { IBlog } from "@/modals/blog.model"
import type { ICourse } from "@/modals/course.model"
import type { IProduct } from "@/modals/product.model"
import { getBlogs } from "@/server-functions/blog"
import { getCourses } from "@/server-functions/course"
import { getPublishedProducts } from "@/server-functions/product"
import ProductCard from "@/components/product/product-card"
import { useDataStore } from "@/store"
import { ArrowRight, BookOpen, CheckCircle2, Code2, FileText, GraduationCap, Layers3, Mail, Package, Search, Sparkles } from "lucide-react"
import { cn } from "@/modals/utils"
import type { IconType } from "react-icons"
import {
  SiPython, SiJavascript, SiTypescript, SiC, SiCplusplus, SiSharp, SiRust, SiGo, SiPhp, SiKotlin,
  SiReact, SiNextdotjs, SiNodedotjs, SiExpress, SiMongodb, SiPostgresql, SiDocker, SiGit, SiLinux,
  SiTailwindcss, SiOpenai,
} from "react-icons/si"

export default function HomePage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [search, setSearch] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const coursesStore = useDataStore<ICourse[]>("courses", [])()
  const blogsStore = useDataStore<IBlog[]>("blogs", [])()
  const productsStore = useDataStore<IProduct[]>("home-products", [])()

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courses, blogs, products] = await Promise.all([
          getCourses({ skip: 0, postsPerPage: 4 }),
          getBlogs({ skip: 0, postsPerPage: 4, publicOnly: true }),
          getPublishedProducts({ skip: 0, postsPerPage: 4 }),
        ])

        if ("courses" in courses) coursesStore.setData(courses.courses)
        if ("blogs" in blogs) blogsStore.setData(blogs.blogs)
        if ("products" in products) productsStore.setData(products.products as IProduct[])
      } catch (error) {
        console.error("Data fetching error:", error)
      }
    }

    fetchInitialData()
  }, [coursesStore.setData, blogsStore.setData, productsStore.setData])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = search.trim()
    router.push(query ? `/courses?search=${encodeURIComponent(query)}` : "/courses")
  }

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubscribed(true)
  }

  const reveal = reduceMotion
    ? undefined
    : { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } } }
  const stagger = reduceMotion
    ? undefined
    : { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            <motion.div className="max-w-2xl" initial="hidden" animate="show" variants={reveal}>
              <motion.span variants={reveal} className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles size={14} className="text-primary" /> Practical learning for your next step
              </motion.span>
              <motion.h1 variants={reveal} className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
                Learn skills. Build projects. <span className="text-primary">Move forward.</span>
              </motion.h1>
              <motion.p variants={reveal} className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Discover practical courses, clear articles and useful digital resources created for students, developers and curious builders.
              </motion.p>

              <motion.form variants={reveal} onSubmit={submitSearch} className="mt-8 flex max-w-xl gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      type="search"
                      placeholder="Search courses, articles or topics"
                      aria-label="Search courses"
                      className={cn("h-12 rounded-xl bg-background/70 pl-10 pr-4 focus-visible:ring-1")}
                    />
                  </div>
                  <Button type="submit" className="h-12 gap-2 px-5"><Search size={17} /> <span className="hidden sm:inline">Search</span></Button>
              </motion.form>
              <motion.div variants={reveal} className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/courses">Explore courses <ArrowRight size={16} /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/products">Browse resources</Link></Button>
              </motion.div>
            </motion.div>
            <motion.div
              className="relative hidden min-h-[310px] lg:block"
              initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <motion.div animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [6, 8, 6] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute right-8 top-4 h-64 w-64 rounded-[2rem] border bg-card/80 shadow-2xl shadow-primary/10 rotate-6" />
              <motion.div whileHover={reduceMotion ? undefined : { y: -8, rotate: -1 }} className="absolute right-20 top-10 h-64 w-64 rounded-[2rem] border bg-card p-6 shadow-2xl shadow-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen size={24} /></div>
                <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your learning library</p>
                <p className="mt-2 text-2xl font-semibold">Learn at your pace.</p>
                <div className="mt-8 space-y-3 text-sm text-muted-foreground">
                  {["Structured courses", "Helpful articles", "Downloadable resources"].map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" />{item}</p>)}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <Value icon={BookOpen} title="Learn step by step" text="Follow structured courses built around practical outcomes." />
          <Value icon={FileText} title="Understand clearly" text="Use focused articles to solve problems and fill knowledge gaps." />
          <Value icon={Package} title="Take it with you" text="Keep useful notes, templates and downloads in your library." />
        </motion.section>

        <LearningShowcase reduceMotion={!!reduceMotion} />

        <Section eyebrow="Start learning" title="Featured courses" description="Build useful skills with focused, practical learning paths." actionHref="/courses" actionText="View all courses">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coursesStore.data.map((course) => (
              <motion.div key={course.slug} variants={reveal} whileHover={reduceMotion ? undefined : { y: -7 }} transition={{ type: "spring", stiffness: 280, damping: 20 }}>
                <CourseCard title={course.title} description={course.description} slug={`/course/${course.slug}`} image={course.thumbnail} price={course.price} className="h-full group hover:border-primary/20 transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {productsStore.data.length > 0 && (
          <Section eyebrow="Useful downloads" title="Resources for your workflow" description="Notes, templates and digital products to help you learn and create faster." actionHref="/products" actionText="View all resources">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsStore.data.map((product) => (
                  <motion.div key={product.slug} variants={reveal} whileHover={reduceMotion ? undefined : { y: -7 }} transition={{ type: "spring", stiffness: 280, damping: 20 }}><ProductCard product={product} /></motion.div>
              ))}
            </motion.div>
          </Section>
        )}

        <Section eyebrow="Keep exploring" title="Latest articles" description="Clear explanations, tutorials and ideas from the Studic community." actionHref="/blogs" actionText="Read all articles">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {blogsStore.data.map((blog) => (
              <motion.div key={blog.slug} variants={reveal} whileHover={reduceMotion ? undefined : { y: -7 }} transition={{ type: "spring", stiffness: 280, damping: 20 }}>
                <BlogCard title={blog.title} description={blog.description} slug={blog.category?.length ? `/t/${blog.category[0]}/${blog.slug}` : `/t/${blog.slug}`} image={blog.thumbnail} date={blog.publishedAt + ""} className="h-full hover:border-primary/20 transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-muted/40 px-6 py-12 text-center sm:px-12">
            <div className="mx-auto max-w-xl space-y-5">
              <div className="space-y-2">
                <Mail className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-3xl font-bold">Get better learning ideas in your inbox</h2>
                <p className="text-muted-foreground">
                  Occasional course updates, useful resources and practical learning tips. No noise.
                </p>
              </div>

              <form onSubmit={subscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12  focus-visible:ring-0 flex-1"
                />
                <Button
                  type="submit"
                  className="h-12"
                >
                  Subscribe
                </Button>
              </form>
              {subscribed && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">You’re on the list. Thanks for subscribing!</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

const showcaseGroups = {
  programming: {
    eyebrow: "Languages & foundations",
    title: "Find your next programming language",
    description: "From your first line of code to building production-ready applications.",
    items: [
      { name: "Python", detail: "Beginner to advanced", mark: "Py", tone: "bg-[#3776AB]/10 text-[#3776AB]" },
      { name: "JavaScript", detail: "Web development", mark: "JS", tone: "bg-[#F7DF1E]/20 text-[#A88700]" },
      { name: "TypeScript", detail: "Typed JavaScript", mark: "TS", tone: "bg-[#3178C6]/10 text-[#3178C6]" },
      { name: "Java", detail: "OOP & application development", mark: "Ja", tone: "bg-[#E76F00]/10 text-[#E76F00]" },
      { name: "C", detail: "Programming fundamentals", mark: "C", tone: "bg-[#5C6BC0]/10 text-[#5C6BC0]" },
      { name: "C++", detail: "Data structures & algorithms", mark: "C++", tone: "bg-[#00599C]/10 text-[#00599C]" },
      { name: "C#", detail: ".NET development", mark: "C#", tone: "bg-[#68217A]/10 text-[#68217A]" },
      { name: "Rust", detail: "Systems programming", mark: "Rs", tone: "bg-[#CE422B]/10 text-[#CE422B]" },
      { name: "Go", detail: "Cloud & backend", mark: "Go", tone: "bg-[#00ADD8]/10 text-[#0099BE]" },
      { name: "PHP", detail: "Server-side web", mark: "Php", tone: "bg-[#777BB4]/10 text-[#777BB4]" },
      { name: "Kotlin", detail: "Modern Android", mark: "Kt", tone: "bg-[#7F52FF]/10 text-[#7F52FF]" },
      { name: "SQL", detail: "Databases & querying", mark: "SQL", tone: "bg-[#4479A1]/10 text-[#4479A1]" },
    ],
  },
  technologies: {
    eyebrow: "Tools & ecosystems",
    title: "Explore the technologies behind real products",
    description: "Frameworks, developer tools, databases and platforms worth learning.",
    items: [
      { name: "React", detail: "Frontend UI library", mark: "Re", tone: "bg-[#61DAFB]/15 text-[#0891B2]" },
      { name: "Next.js", detail: "Full-stack React framework", mark: "N", tone: "bg-foreground/10 text-foreground" },
      { name: "Node.js", detail: "JavaScript runtime", mark: "Nd", tone: "bg-[#5FA04E]/10 text-[#438A35]" },
      { name: "Express", detail: "Backend APIs", mark: "Ex", tone: "bg-foreground/10 text-foreground" },
      { name: "MongoDB", detail: "Document database", mark: "Mg", tone: "bg-[#47A248]/10 text-[#47A248]" },
      { name: "PostgreSQL", detail: "Relational database", mark: "Pg", tone: "bg-[#4169E1]/10 text-[#4169E1]" },
      { name: "Docker", detail: "Containers & deployment", mark: "Dk", tone: "bg-[#2496ED]/10 text-[#2496ED]" },
      { name: "Git & GitHub", detail: "Version control", mark: "Git", tone: "bg-[#F05032]/10 text-[#F05032]" },
      { name: "Linux", detail: "Operating systems", mark: "Lx", tone: "bg-[#D4A017]/15 text-[#A67C00]" },
      { name: "AWS", detail: "Cloud computing", mark: "AWS", tone: "bg-[#FF9900]/10 text-[#C77700]" },
      { name: "Tailwind CSS", detail: "Utility-first styling", mark: "Tw", tone: "bg-[#06B6D4]/10 text-[#0891B2]" },
      { name: "AI & ML", detail: "Machine learning basics", mark: "AI", tone: "bg-[#8B5CF6]/10 text-[#8B5CF6]" },
    ],
  },
  universities: {
    eyebrow: "University ecosystem",
    title: "Institutions that shape learning",
    description: "A showcase of recognised universities and learning platforms. Studic courses are organised by subject, not restricted to a single university.",
    items: [
      { name: "IGNOU", detail: "Open & distance learning", mark: "IGNOU", tone: "bg-[#0B5CAB]/10 text-[#0B5CAB]", featured: true },
      { name: "University of Delhi", detail: "Undergraduate & postgraduate", mark: "DU", tone: "bg-[#8B1E2D]/10 text-[#8B1E2D]" },
      { name: "Amity University", detail: "Online & campus programmes", mark: "AU", tone: "bg-[#C8102E]/10 text-[#C8102E]" },
      { name: "Jamia Millia Islamia", detail: "University programmes", mark: "JMI", tone: "bg-[#0B6B45]/10 text-[#0B6B45]" },
      { name: "IITs", detail: "Technology & engineering", mark: "IIT", tone: "bg-[#1E4D8C]/10 text-[#1E4D8C]" },
      { name: "NPTEL", detail: "Online technical courses", mark: "NPTEL", tone: "bg-[#B22222]/10 text-[#B22222]" },
      { name: "Swayam", detail: "Online learning platform", mark: "SW", tone: "bg-[#F28C28]/10 text-[#D97706]" },
      { name: "Dr. B. R. Ambedkar Open University", detail: "Open & distance learning", mark: "BRAOU", tone: "bg-[#315C8C]/10 text-[#315C8C]" },
    ],
  },
} as const

const languageIcons: Record<string, IconType> = {
  Python: SiPython,
  JavaScript: SiJavascript,
  TypeScript: SiTypescript,

  C: SiC,
  "C++": SiCplusplus,
  "C#": SiSharp,
  Rust: SiRust,
  Go: SiGo,
  PHP: SiPhp,
  Kotlin: SiKotlin,
}

const technologyIcons: Record<string, IconType> = {
  React: SiReact,
  "Next.js": SiNextdotjs,
  "Node.js": SiNodedotjs,
  Express: SiExpress,
  MongoDB: SiMongodb,
  PostgreSQL: SiPostgresql,
  Docker: SiDocker,
  "Git & GitHub": SiGit,
  Linux: SiLinux,

  "Tailwind CSS": SiTailwindcss,
  "AI & ML": SiOpenai,
}

type ShowcaseTab = keyof typeof showcaseGroups

function LearningShowcase({ reduceMotion }: { reduceMotion: boolean }) {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("programming")
  const [showAll, setShowAll] = useState(false)
  const group = showcaseGroups[activeTab]
  const items = showAll ? group.items : group.items.slice(0, 8)

  const tabs: { id: ShowcaseTab; label: string; icon: typeof Code2 }[] = [
    { id: "programming", label: "Programming", icon: Code2 },
    { id: "technologies", label: "Technologies", icon: Layers3 },
    { id: "universities", label: "Universities", icon: GraduationCap },
  ]

  return (
    <section className="relative overflow-hidden border-y bg-muted/20 py-16 sm:py-20">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-violet-500/[0.06] blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            A world of learning, in one place
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            What would you like to <span className="text-primary">learn?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Explore popular programming languages, modern technologies and recognised universities.
            Discover what you can learn, wherever you study.
          </p>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Learning categories">
          {tabs.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`showcase-tab-${id}`}
                aria-selected={selected}
                aria-controls="showcase-panel"
                onClick={() => { setActiveTab(id); setShowAll(false) }}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "border-border bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </div>

        <div
          id="showcase-panel"
          role="tabpanel"
          aria-labelledby={`showcase-tab-${activeTab}`}
          className="mt-9"
        >
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{group.eyebrow}</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{group.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            </div>
            <span className="text-xs text-muted-foreground">{group.items.length} topics to explore</span>
          </div>

          <motion.div
            key={activeTab + (showAll ? "-all" : "-featured")}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {items.map((item) => {
              const BrandIcon = activeTab === "programming"
                ? languageIcons[item.name]
                : activeTab === "technologies"
                  ? technologyIcons[item.name]
                  : undefined
              const cardContent = (
                <>
                  <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight sm:h-14 sm:w-14", item.tone)}>
                    {BrandIcon ? <BrandIcon size={28} aria-hidden="true" /> : item.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-sm font-semibold leading-snug sm:text-base", activeTab !== "universities" && "group-hover:text-primary")}>{item.name}</span>
                      {"featured" in item && item.featured && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">Focus</span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
                  </span>
                  {activeTab !== "universities" && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  )}
                </>
              )
              const cardClassName = cn(
                "relative flex min-h-[112px] items-center gap-3 rounded-2xl border bg-card/80 p-3.5 shadow-sm sm:min-h-[120px] sm:gap-4 sm:p-4",
                activeTab === "universities"
                  ? "cursor-default"
                  : "group transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/[0.06]"
              )

              return activeTab === "universities" ? (
                <div key={item.name} className={cardClassName}>
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={`/courses?search=${encodeURIComponent(item.name)}`}
                  className={cardClassName}
                >
                  {cardContent}
                </Link>
              )
            })}
          </motion.div>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {activeTab === "universities"
              ? "University names are shown for context. Courses on Studic are organised around subjects and skills."
              : "New subjects and learning paths are added as Studic grows."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {group.items.length > 8 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show less" : "Explore all"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
            {activeTab !== "universities" && (
              <Button asChild size="sm" className="gap-2">
                <Link href="/courses">
                  Explore courses <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Reusable Section Component
function Section({
  eyebrow,
  title,
  description,
  actionHref,
  actionText,
  className = "",
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  actionHref: string
  actionText: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8 ${className}`}>
      <div>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
            {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
          <Link href={actionHref}>
            <Button variant="outline" className="gap-2 text-muted-foreground hover:text-foreground">
              {actionText}
              <span className="text-primary">→</span>
            </Button>
          </Link>
        </div>
        {children}
      </div>
    </section>
  )
}

function Value({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof BookOpen
  title: string
  text: string
}) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border bg-card/60 p-5">
      <Icon size={20} className="text-primary" />
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </motion.div>
  )
}