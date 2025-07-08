import { YouTubeEmbed } from "@next/third-parties/google";
import { ArrowUpRight } from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/ds";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Grid from "@/public/examples/grid.jpg";
import Masonry from "@/public/examples/masonry.jpg";
import Minimal from "@/public/examples/minimal.jpg";
import Square from "@/public/examples/square.jpg";
import Bg from "@/public/home.webp";

const examplePortfolios: {
	title: string;
	href: string;
	image: StaticImageData;
}[] = [
	{
		title: "Masonry",
		href: "/masonry",
		image: Masonry,
	},
	{
		title: "Grid",
		href: "/grid",
		image: Grid,
	},
	{
		title: "Square",
		href: "/square",
		image: Square,
	},
	{
		title: "Minimal",
		href: "/minimal",
		image: Minimal,
	},
];

export default function Home() {
	return (
		<main className="flex flex-col tracking-tight">
			<Section className="divide-y !py-0">
				<Container className="border-x bg-accent/30">
					<nav>
						<div className="flex justify-between items-center gap-6 text-lg">
							<div className="flex items-center gap-2">
								<Logo width={24} />
							</div>
							<div className="flex justify-between gap-4 uppercase font-bold">
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/sign-in?tab=login"
								>
									Login
								</Link>
								<Link
									className="text-orange-500 hover:text-orange-700 flex items-center gap-1"
									href="/sign-in?tab=signup"
								>
									Create Account{" "}
									<span className="bg-orange-500 text-white px-1 py-0.5 rounded text-xs">
										FREE
									</span>
								</Link>
							</div>
						</div>
					</nav>
				</Container>

				<Container className="bg-grid space-y-6 border-x uppercase font-bold">
					<h1 className="text-6xl md:text-9xl text-balance leading-[0.9]">
						<span className="text-muted-foreground">Wrk.so ✏︎</span> Portfolios
						for Creatives
					</h1>
					<h2 className="text-xl md:text-3xl text-balance text-muted-foreground">
						A platform for creatives to showcase their work and capture
						opportunities.
					</h2>
				</Container>

				<Container className="!p-0 border-x bg-border">
					<h3 className="sr-only">Examples</h3>
					<div className="grid gap-px sm:grid-cols-2">
						{examplePortfolios.map((example) => (
							<Link
								className="p-4 bg-background hover:bg-accent transition-colors space-y-4"
								key={example.href}
								href={example.href}
							>
								<Image
									src={example.image}
									alt={example.title}
									placeholder="blur"
								/>
								<div className="flex items-center justify-between gap-2 uppercase">
									<h4 className="font-semibold">{example.title}</h4>
									<p className="text-muted-foreground flex items-center gap-1">
										View Demo <ArrowUpRight size={14} />
									</p>
								</div>
							</Link>
						))}
					</div>
				</Container>

				<Container className="border-x !p-0">
					<div className="grid md:grid-cols-2">
						<div className="border-r p-6">
							<h3 className="text-2xl font-bold mb-8 uppercase">
								A Creative-first Portfolio site so you can show your work.
							</h3>
							<div className="text-lg space-y-6">
								<div>
									<h4 className="font-bold mb-3 uppercase">For Creatives</h4>
									<ul className="space-y-1">
										<li>- Four unique grid layouts</li>
										<li>- Drag & drop project reordering</li>
										<li>- High-resolution image optimization</li>
										<li>- Custom username URLs</li>
										<li>- Mobile-responsive design</li>
									</ul>
								</div>

								<div>
									<h4 className="font-bold mb-3 uppercase">Smart Features</h4>
									<ul className="space-y-1">
										<li>- AI-powered description generation</li>
										<li>- Advanced analytics & insights</li>
										<li>- Contact forms & lead management</li>
										<li>- SEO optimization built-in</li>
										<li>- GitHub & Google OAuth</li>
									</ul>
								</div>
							</div>
						</div>

						<div className="flex flex-col h-full">
							<div className="border-b p-6 bg-accent">
								<h3 className="text-3xl font-bold uppercase">
									It&apos;s <span className="text-orange-500">free</span> to
									create an account. You don&apos;t need an invite. You just
									need to{" "}
									<span className="text-orange-500">
										<Link href="/sign-in?tab=signup">share your work!</Link>
									</span>
								</h3>
							</div>

							<div className="p-6 h-full">
								<h4 className="text-xl font-bold mb-6 uppercase">
									Paid Features (Optional)
								</h4>
								<div className="text-lg space-y-4">
									<div className="p-4 border rounded">
										<h5 className="font-bold mb-2">Custom Domains</h5>
										<p className="text-muted-foreground text-base">
											Connect your own domain with automatic SSL.
										</p>
									</div>

									<div className="p-4 border rounded">
										<h5 className="font-bold mb-2">Support the Community</h5>
										<p className="text-muted-foreground text-base">
											Help us grow and support the community.
										</p>
									</div>

									<div className="flex justify-end items-center gap-2 mt-auto">
										<p className="text-sm text-muted-foreground uppercase">
											That will cost
										</p>
										<p className="text-2xl font-bold">$12/month</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Container>

				<Container className="border-x grid md:grid-cols-[auto_1fr] !p-0">
					<div className="p-6 space-y-3 max-w-lg bg-accent/50">
						<h3 className="text-4xl font-bold uppercase">
							Watch a demo of the platform in action.
						</h3>
						<p className="text-2xl font-semibold text-muted-foreground">
							Always be ready when someone asks you to show your work.
						</p>
					</div>
					<div className="border-l p-6">
						<YouTubeEmbed videoid="ogfYd705cRs" params="controls=0" />
					</div>
				</Container>

				<Container className="border-x !p-0">
					<div className="grid md:grid-cols-3 gap-px bg-border">
						<div className="bg-background p-8 flex flex-col items-start space-y-3">
							<div className="text-orange-500 font-bold text-4xl">1</div>
							<h4 className="text-xl font-bold uppercase">Create Account</h4>
							<p className="text-muted-foreground">
								Sign up with GitHub, Google, or email. No invite needed,
								completely free to start.
							</p>
						</div>

						<div className="bg-background p-8 flex-col items-start space-y-3">
							<div className="text-orange-500 font-bold text-4xl">2</div>
							<h4 className="text-xl font-bold uppercase">Upload Your Work</h4>
							<p className="text-muted-foreground">
								Drag and drop your images, choose a layout, and let our AI help
								write descriptions.
							</p>
						</div>

						<div className="bg-background p-8 flex-col items-start space-y-3">
							<div className="text-orange-500 font-bold text-4xl">3</div>
							<h4 className="text-xl font-bold uppercase">Share & Connect</h4>
							<p className="text-muted-foreground">
								Get your custom URL and start sharing your portfoliso with the
								world.
							</p>
						</div>
					</div>
				</Container>

				<Container className="border-x relative flex flex-col gap-32 items-end">
					<h3 className="text-4xl font-bold uppercase">
						Create your portfolio in minutes
					</h3>
					<div className="flex gap-4 uppercase font-bold text-xl">
						<Link
							className="text-muted-foreground hover:text-foreground"
							href="/sign-in?tab=login"
						>
							Login
						</Link>
						<Link
							className="text-orange-500 hover:text-orange-700 flex items-center gap-1"
							href="/sign-in?tab=signup"
						>
							Create Account{" "}
							<span className="bg-orange-500 text-white px-1 py-0.5 rounded text-xs">
								FREE
							</span>
						</Link>
					</div>
					<Image
						src={Bg}
						alt="Wrk.so"
						fill
						className="object-cover -z-10 dark:invert"
					/>
				</Container>

				<Container className="border-x bg-accent/30">
					<footer>
						<div className="flex justify-between items-center gap-4">
							<div className="space-y-1 text-muted-foreground ">
								<p className="text-sm uppercase">
									Created by <a href="https://wiiip.com">WIP</a>
								</p>
								<div className="flex items-center gap-2 text-sm">
									<Link href="/privacy">Privacy Policy</Link>
									<Link href="/terms">Terms of Service</Link>
								</div>
							</div>
							<div className="flex items-center gap-6">
								<p className="text-sm text-muted-foreground">
									© 2025 Wrk.so. All rights reserved.
								</p>
								<ThemeToggle />
							</div>
						</div>
					</footer>
				</Container>
			</Section>
		</main>
	);
}
