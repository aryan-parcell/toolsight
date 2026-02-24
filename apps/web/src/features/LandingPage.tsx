import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ScanLine, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const ParcellLogo = () => (
    <svg width="32" height="32" viewBox="0 0 1113.57 1295.11" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
        <g transform="translate(-91.34 -216.37)">
            <path d="M648.14,1050.6c183.38,0,350.48,70.73,475.71,186.23l81.06-46.82C1061.72,1048.36,865,960.71,648.14,960.71S234.55,1048.36,91.34,1190l81.08,46.81C297.64,1121.33,464.76,1050.6,648.14,1050.6Z" fill="currentColor" />
            <path d="M648.14,1234.15A516,516,0,0,1,954.49,1334.6l83.81-48.39c-105.72-88.54-241.8-142-390.16-142s-284.46,53.42-390.18,142l83.82,48.39A516,516,0,0,1,648.14,1234.15Z" fill="currentColor" />
            <path d="M841.63,1399.76a403,403,0,0,0-387,0l193.5,111.72Z" fill="currentColor" />
            <path d="M172.94,1089.27V584.32L648.13,310l475.2,274.34v504.95a802.08,802.08,0,0,1,78.21,67.16h2.86V537.51L648.13,216.37,91.86,537.51v618.92h2.88A800.79,800.79,0,0,1,172.94,1089.27Z" fill="currentColor" />
            <path d="M648.14,930.31a787.27,787.27,0,0,1,441.91,135.16v-462L648.13,347.14V930.31Z" fill="currentColor" />
        </g>
    </svg>
);

const ParcellHeader = () => (
    <div className="flex items-center py-3">
        <div className="mr-3">
            <ParcellLogo />
        </div>
        <div className="text-xl font-black text-white tracking-tight">
            Parcell <span className="text-axiom-cyan">ToolSight</span>
        </div>
    </div>
);

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
    const [formData, setFormData] = useState({ fullName: '', email: '', company: '', environment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const scrollToDemo = () => {
        document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "demo_bookings"), {
                ...formData,
                status: "new",
                createdAt: serverTimestamp()
            });
            setIsSuccess(true);
            setFormData({ fullName: '', email: '', company: '', environment: '' });
        } catch (error) {
            console.error("Error booking demo:", error);
            alert("Something went wrong. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-axiom-cyan selection:text-black scroll-smooth">
            {/* Navbar */}
            <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <ParcellHeader />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onLogin} className="text-gray-300 hover:text-white">
                            Sign In
                        </Button>
                        <Button onClick={scrollToDemo} variant="outline" className="border-axiom-cyan/50 text-axiom-cyan hover:bg-axiom-cyan/10">
                            Book Demo
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-axiom-cyan/10 border border-axiom-cyan/20 text-axiom-cyan text-xs font-bold tracking-wide uppercase">
                            <span className="w-2 h-2 rounded-full bg-axiom-cyan animate-pulse"></span>
                            AI-Powered Accountability
                        </div>
                        <h1 className="text-5xl font-black text-white leading-tight">
                            Tactical Toolbox.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-axiom-cyan to-blue-500">
                                Automated Audits.
                            </span>
                        </h1>
                        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                            AI-powered inventory management for precision environments.
                            <br />
                            Snap a photo, and instantly verify every wrench, socket, and plier is accounted for.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button onClick={scrollToDemo} size="lg" className="bg-axiom-cyan text-black font-bold hover:bg-[#00ccff] h-14 px-8 text-lg w-full sm:w-auto">
                                Book Demo <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Hero Graphic / Mockup Placeholder */}
                    <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
                        <div className="absolute inset-0 bg-gradient-to-tr from-axiom-cyan/20 to-transparent blur-3xl rounded-full"></div>
                        <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <ScanLine className="w-16 h-16 text-gray-700 mx-auto" />
                                <p className="text-gray-500 font-mono text-sm">[ App Interface / AI Bounding Box Mockup ]</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-900 border-y border-gray-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Precision Tracking for Aviation Maintenance</h2>
                        <p className="text-gray-400">Built to handle the strict requirements of tool control and foreign object damage (FOD) prevention programs.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ScanLine className="w-6 h-6 text-axiom-cyan" />}
                            title="Real-Time Detection"
                            description="Instantly identify tool status with AI-powered visual recognition."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-6 h-6 text-axiom-cyan" />}
                            title="Mission Critical"
                            description="Ensure compliance and operational readiness every single time."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-axiom-cyan" />}
                            title="Vendor-Agnostic Design"
                            description="Compatible with any toolbox brand or layout without proprietary hardware."
                        />
                    </div>
                </div>
            </section>

            {/* See It In Action (Demo Form Section) */}
            <section id="demo-section" className="py-24 relative overflow-hidden bg-gray-950">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column: Info */}
                    <div className="space-y-8 relative z-10">
                        <h2 className="text-4xl lg:text-5xl font-black text-white">See It In Action</h2>
                        <p className="text-xl text-gray-400 max-w-md">
                            Schedule a personalized demo and discover how ToolSight transforms inventory management for your operation.
                        </p>

                        <div className="space-y-6 pt-4">
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-axiom-cyan flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-lg font-bold text-white">Custom Walkthrough</h4>
                                    <p className="text-sm text-gray-400">We tailor the demo to your specific environment and requirements</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-axiom-cyan flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-lg font-bold text-white">Integration Planning</h4>
                                    <p className="text-sm text-gray-400">Discuss deployment timeline and integration with your systems</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-axiom-cyan flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-lg font-bold text-white">Expert Consultation</h4>
                                    <p className="text-sm text-gray-400">Get insights from our team on optimization and best practices</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="relative z-10">
                        <div className="bg-[#111624] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                            {/* Gradient Top Border */}
                            <div className="h-1 w-full bg-gradient-to-r from-axiom-cyan to-blue-600"></div>

                            <div className="p-8 sm:p-10">
                                <h3 className="text-2xl font-bold text-white mb-2">Schedule My Demo</h3>
                                <p className="text-sm text-gray-400 mb-8">See ToolSight in action with your own inventory parameters.</p>

                                {isSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in fade-in zoom-in">
                                        <div className="w-16 h-16 bg-axiom-cyan/20 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-axiom-cyan" />
                                        </div>
                                        <h4 className="text-xl font-bold text-white">Request Received!</h4>
                                        <p className="text-gray-400 text-sm">We'll be in touch shortly to schedule your custom walkthrough.</p>
                                        <Button variant="outline" onClick={() => setIsSuccess(false)} className="mt-4 border-gray-700 hover:bg-gray-800">
                                            Submit Another
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleDemoSubmit} className="space-y-5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Enter your name"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-axiom-cyan focus:ring-1 focus:ring-axiom-cyan outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Email</label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="name@company.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-axiom-cyan focus:ring-1 focus:ring-axiom-cyan outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Your company"
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-axiom-cyan focus:ring-1 focus:ring-axiom-cyan outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Environment</label>
                                            <select
                                                required
                                                value={formData.environment}
                                                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-axiom-cyan focus:ring-1 focus:ring-axiom-cyan outline-none transition-all appearance-none"
                                            >
                                                <option value="" disabled>Select your environment</option>
                                                <option value="commercial">Commercial Aviation</option>
                                                <option value="defense">Defense / Military</option>
                                                <option value="mro">MRO Facility</option>
                                                <option value="automotive">Automotive</option>
                                                <option value="manufacturing">Manufacturing</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-axiom-cyan text-black font-bold hover:bg-[#00ccff] h-12 mt-4 text-md flex items-center justify-center"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Demo Request"}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-800 text-center text-sm text-gray-600 bg-gray-950">
                <p>© 2026 Parcell ToolSight. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-gray-950 border border-gray-800 p-8 rounded-2xl hover:border-axiom-cyan/50 transition-colors group">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}
