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
import { ArrowRight, BookOpen, CheckCircle2, FileText, Mail, Package, Search, Sparkles } from "lucide-react"
import { cn } from "@/modals/utils"

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
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
            animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.55, 0.8, 0.55] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
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