import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LanguageToggle = () => {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'en', label: 'English', short: 'EN' },
        { code: 'mr', label: 'मराठी', short: 'म' },
        { code: 'hi', label: 'हिन्दी', short: 'हि' }
    ];

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('i18nextLng', code);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2 h-auto rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-200 animate-pulse hover:animate-none group"
                >
                    <Globe className="h-4 w-4 text-white group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-xs font-bold tracking-widest uppercase">
                        {currentLang.short}
                    </span>
                    <ChevronDown className="h-3 w-3 text-white/50 group-hover:text-white transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-gray-100 shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="px-2 py-1.5 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Select Language
                </div>
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5",
                            i18n.language === lang.code
                                ? "bg-red-50 text-red-600 font-bold"
                                : "hover:bg-gray-50 text-gray-600 font-medium"
                        )}
                    >
                        <span className="text-sm">{lang.label}</span>
                        {i18n.language === lang.code && (
                            <div className="bg-red-500 rounded-full p-0.5 shadow-sm">
                                <Check className="h-2 w-2 text-white" />
                            </div>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
