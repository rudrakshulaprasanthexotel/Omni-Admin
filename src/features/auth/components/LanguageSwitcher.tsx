import { ListItemIcon, ListItemText, MenuItem, Popover, Typography, Button } from '@exotel-npm-dev/signal-design-system'
import React, { useState } from 'react'
import ARFlag from '../../../assets/flags/ar.svg';
import DEFlag from '../../../assets/flags/de.svg';
import FRFlag from '../../../assets/flags/fr.svg';
import JAFlag from '../../../assets/flags/ja.svg';
import THFlag from '../../../assets/flags/th.svg';
import TRFlag from '../../../assets/flags/tr.svg';
import USFlag from '../../../assets/flags/us.svg';
import i18n from '@/services/i18n';

type LanguageType = {
    id: string;
    title: string;
    flag: any;
};

const languages: LanguageType[] = [
    {
        id: 'en',
        title: 'English (EN)',
        flag: USFlag
    },
    {
        id: 'tr',
        title: 'Turkish (TR)',
        flag: TRFlag
    },
    {
        id: 'de',
        title: 'German (DE)',
        flag: DEFlag
    },
    {
        id: 'ar',
        title: 'Arabic (AR)',
        flag: ARFlag
    },
    {
        id: 'fr',
        title: 'French (FR)',
        flag: FRFlag
    },
    {
        id: 'ja',
        title: 'Japanese (JA)',
        flag: JAFlag
    },
    {
        id: 'th',
        title: 'Thai (TH)',
        flag: THFlag
    }
];

const LanguageSwitcher = () => {
    const [menu, setMenu] = useState<null | HTMLElement>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>(languages[0]);

    const langMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setMenu(event.currentTarget);
    };

    const langMenuClose = () => {
        setMenu(null);
    };

    function handleLanguageChange(lng: LanguageType) {
        setSelectedLanguage(lng);
        langMenuClose();
        i18n.changeLanguage(lng.id);

        if (lng.id === 'ar') {
            document.body.dir = 'rtl';
        } else {
            document.body.dir = 'ltr';
        }
    }

    return (
        <>
            <Button
                onClick={langMenuClick}
                variant='outlined'
                size='small'
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <img
                    src={selectedLanguage.flag}
                    alt={selectedLanguage.title}
                />

                <Typography
                    variant='title2'
                    textTransform='uppercase'
                >
                    {selectedLanguage.id}
                </Typography>
            </Button>
            <Popover
                open={Boolean(menu)}
                anchorEl={menu}
                onClose={langMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
            >
                {languages.map((lng) => (
                    <MenuItem
                        key={lng.id}
                        onClick={() => handleLanguageChange(lng)}
                        sx={{
                            backgroundColor: selectedLanguage.id === lng.id ? 'custom.highlight' : 'transparent',
                        }}
                    >
                        <ListItemIcon>
                            <img
                                src={lng.flag}
                                alt={lng.title}
                            />
                        </ListItemIcon>
                        <ListItemText primary={lng.title} />
                    </MenuItem>
                ))}
            </Popover>
        </>
    );
};

export default LanguageSwitcher;
