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
        { code: 'mr', label: 'मराठी', short: 'MR' },
        { code: 'hi', label: 'हिन्दी', short: 'HI' }
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
                    className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-full border border-gray-200/50 bg-white/50 backdrop-blur-md hover:bg-gray-100/80 hover:border-red-500/30 transition-all duration-300 group shadow-sm active:scale-95"
                >
                    <div className="bg-red-500/10 p-1 rounded-full group-hover:bg-red-500/20 transition-colors">
                        <Globe className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700 tracking-tight uppercase">
                        {currentLang.short}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-2xl border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-2 py-1.5 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Select Language
                </div>
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5",
                            i18n.language === lang.code
                                ? "bg-red-50 text-red-600 font-bold"
                                : "hover:bg-gray-50 text-gray-600 font-medium"
                        )}
                    >
                        <span className="text-sm">{lang.label}</span>
                        {i18n.language === lang.code && (
                            <div className="bg-red-500 rounded-full p-0.5 shadow-lg shadow-red-500/20">
                                <Check className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
