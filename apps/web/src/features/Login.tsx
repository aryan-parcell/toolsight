import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Mail, Lock, AlertCircle, Loader, Building } from 'lucide-react';
import { collection, doc, setDoc } from 'firebase/firestore';

const ParcellLogo = () => (
    <svg width="64" height="64" viewBox="0 0 1113.57 1295.11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(-91.34 -216.37)">
            <path d="M648.14,1050.6c183.38,0,350.48,70.73,475.71,186.23l81.06-46.82C1061.72,1048.36,865,960.71,648.14,960.71S234.55,1048.36,91.34,1190l81.08,46.81C297.64,1121.33,464.76,1050.6,648.14,1050.6Z" fill="currentColor" />
            <path d="M648.14,1234.15A516,516,0,0,1,954.49,1334.6l83.81-48.39c-105.72-88.54-241.8-142-390.16-142s-284.46,53.42-390.18,142l83.82,48.39A516,516,0,0,1,648.14,1234.15Z" fill="currentColor" />
            <path d="M841.63,1399.76a403,403,0,0,0-387,0l193.5,111.72Z" fill="currentColor" />
            <path d="M172.94,1089.27V584.32L648.13,310l475.2,274.34v504.95a802.08,802.08,0,0,1,78.21,67.16h2.86V537.51L648.13,216.37,91.86,537.51v618.92h2.88A800.79,800.79,0,0,1,172.94,1089.27Z" fill="currentColor" />
            <path d="M648.14,930.31a787.27,787.27,0,0,1,441.91,135.16v-462L648.13,347.14V930.31Z" fill="currentColor" />
        </g>
    </svg>
);

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            // 1. Create admin user account
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCred.user.uid;

            // 2. Create organization document
            const orgRef = doc(collection(db, 'organizations'));
            await setDoc(orgRef, {
                name: orgName,
            });

            // 3. Create user document linked to organization
            await setDoc(doc(db, 'users', uid), {
                email,
                displayName: email.split('@')[0],
                organizationId: orgRef.id,
                role: 'admin',
            });

            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        if (isSignUp) {
            handleSignUp(e);
        } else {
            handleSignIn(e);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8 space-y-2">
                    <ParcellLogo />
                    <h1 className="text-3xl font-bold text-axiom-textLight dark:text-white">
                        Parcell <span className="text-axiom-cyan">ToolSight</span>
                    </h1>
                    <p className="text-axiom-textLight/60 dark:text-axiom-textDark/60">
                        Manage your toolboxes with precision
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark rounded-lg shadow-lg p-8 border border-axiom-borderLight dark:border-axiom-borderDark">
                    <h2 className="text-2xl font-bold mb-6 text-axiom-textLight dark:text-white">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Organization Name Input (Sign Up Only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-axiom-textLight dark:text-axiom-textDark mb-2">
                                    Organization Name
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 w-5 h-5 text-axiom-textLight/40 dark:text-axiom-textDark/40" />
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-axiom-borderLight dark:border-axiom-borderDark rounded-lg bg-axiom-light dark:bg-axiom-dark text-axiom-textLight dark:text-axiom-textDark focus:outline-none focus:border-axiom-cyan focus:ring-2 focus:ring-axiom-cyan/20 transition-colors"
                                        placeholder="Acme Corp Maintenance"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-axiom-textLight dark:text-axiom-textDark mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-axiom-textLight/40 dark:text-axiom-textDark/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-axiom-borderLight dark:border-axiom-borderDark rounded-lg bg-axiom-light dark:bg-axiom-dark text-axiom-textLight dark:text-axiom-textDark placeholder-axiom-textLight/40 dark:placeholder-axiom-textDark/40 focus:outline-none focus:border-axiom-cyan focus:ring-2 focus:ring-axiom-cyan/20 transition-colors"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-axiom-textLight dark:text-axiom-textDark mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-axiom-textLight/40 dark:text-axiom-textDark/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-axiom-borderLight dark:border-axiom-borderDark rounded-lg bg-axiom-light dark:bg-axiom-dark text-axiom-textLight dark:text-axiom-textDark placeholder-axiom-textLight/40 dark:placeholder-axiom-textDark/40 focus:outline-none focus:border-axiom-cyan focus:ring-2 focus:ring-axiom-cyan/20 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Confirm Password Input (Sign Up Only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-axiom-textLight dark:text-axiom-textDark mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-axiom-textLight/40 dark:text-axiom-textDark/40" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-axiom-borderLight dark:border-axiom-borderDark rounded-lg bg-axiom-light dark:bg-axiom-dark text-axiom-textLight dark:text-axiom-textDark placeholder-axiom-textLight/40 dark:placeholder-axiom-textDark/40 focus:outline-none focus:border-axiom-cyan focus:ring-2 focus:ring-axiom-cyan/20 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-axiom-cyan hover:bg-axiom-cyan/90 disabled:bg-axiom-cyan/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    {/* Toggle Sign Up / Sign In */}
                    <div className="flex flex-row gap-2 justify-center items-center mt-6 pt-6 border-t border-axiom-borderLight dark:border-axiom-borderDark">
                        <p className="text-center text-axiom-textLight/70 dark:text-axiom-textDark/70">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        </p>
                        <button
                            type="button"
                            className="text-axiom-cyan font-semibold"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setEmail('');
                                setPassword('');
                                setConfirmPassword('');
                            }}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
