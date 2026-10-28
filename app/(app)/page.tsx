"use client"

import { useEffect } from "react"
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
import { BookOpen, Mail, Search } from "lucide-react"
import { cn } from "@/modals/utils"
import { RxMagnifyingGlass } from "react-icons/rx"

export default function HomePage() {
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-28  relative">
          <div className="w-72 h-72 rounded-full bg-purple-600/30 blur-[128px] absolute  left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[-1]" />

          <div className="px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent leading-tight">
                Master Your Craft with Expert-Led Learning!
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground md:px-12">
                Join our community of passionate learners and transform your skills through immersive courses and practical resources.
              </p>

              <div className="max-w-xl mx-auto">
                <form className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Explore courses and articles..."
                      className={cn("pl-10 pr-4 h-12 rounded-xl bg-secondary-foreground/5 focus-visible:ring-0")}
                    />
                  </div>
                  <Button className="h-12 ">
                    <RxMagnifyingGlass className="size-10 " />
                    <p className="hidden sm:block">
                      Search
                    </p>
                  </Button>
                </form>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                <Link href="/courses">
                  <Button variant="default" className="border-2 border-primary/20 h-11 px-8">
                    Browse All Courses
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" className="h-11 px-8">
                    Shop Resources
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <Section title="Popular Courses" actionHref="/courses" actionText="View All Courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coursesStore.data.map((course) => (
              <CourseCard
                key={course.slug}
                title={course.title}
                description={course.description}
                slug={`/course/${course.slug}`}
                image={course.thumbnail}
                price={course.price}
                className="group hover:border-primary/20 transition-all duration-300 hover:-translate-y-1.5"
              />
            ))}
          </div>
        </Section>

        {/* Featured Products */}
        {productsStore.data.length > 0 && (
          <Section title="Digital Resources" actionHref="/products" actionText="Browse All Products">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsStore.data.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Section>
        )}

        {/* Featured Blogs */}
        <Section title="Latest Articles" actionHref="/blogs" actionText="Read All Articles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {blogsStore.data.map((blog) => (
              <BlogCard
                key={blog.slug}
                title={blog.title}
                description={blog.description}
                slug={blog.category?.length ? `/t/${blog.category[0]}/${blog.slug}` : `/t/${blog.slug}`}
                image={blog.thumbnail}
                date={blog.publishedAt + ""}
                className="hover:border-primary/20 transition-all duration-300 hover:-translate-y-1.5"
              />
            ))}
          </div>
        </Section>

        {/* Newsletter Section */}
        <section className="w-full py-20 ">
          <div>
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="space-y-2">
                <Mail className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-3xl font-bold">Stay Updated</h2>
                <p className="text-muted-foreground">
                  Get curated resources, course updates, and expert insights delivered weekly.
                </p>
              </div>

              <form className="flex gap-2">
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
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// Reusable Section Component
function Section({
  title,
  actionHref,
  actionText,
  className = "",
  children,
}: {
  title: string
  actionHref: string
  actionText: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`w-full py-16 md:py-20 ${className}`}>
      <div className="">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
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