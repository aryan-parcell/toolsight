import React, { useEffect, useState } from 'react';
import { Input } from './ui/input';

interface AutosaveInputProps {
    value: string;
    onSave: (val: string) => void;
    placeholder?: string;
}

export default function AutosaveInput({
    value: initialValue,
    onSave,
    placeholder,
}: AutosaveInputProps) {
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState(false);

    // Sync internal state if prop changes from outside (e.g. real-time update from another user)
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const validate = (val: string) => {
        if (val.trim().length === 0) {
            setError(true);
            return false;
        }
        setError(false);
        return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        validate(newValue);
    };

    const handleBlur = () => {
        if (validate(value) && value.trim() !== initialValue.trim()) onSave(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && validate(value) && value.trim() !== initialValue.trim()) onSave(value);
    };

    return (
        <div className='w-full'>
            <Input
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`
                    bg-white dark:bg-black/50 dark:text-white border-gray-300 dark:border-gray-500 focus-visible:ring-axiom-cyan 
                    ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
                `}
                placeholder={placeholder}
            />
            {error && (
                <span className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1 fade-in">
                    Value cannot be empty
                </span>
            )}
        </div>
    );
};