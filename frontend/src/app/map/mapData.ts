export type MapResourceKind = 'food' | 'gym' | 'parking';

export type MapResourceConfig = {
    kind: MapResourceKind;
    id: string;
    name: string;
    fallbackValue: number;
};

export type MapLink = {
    label: string;
    href: string;
};

export type OverlayPosition = {
    left: number;
    top: number;
    width: number;
    height: number;
    clipPath?: string;
};

export type MapBuildingConfig = {
    id: string;
    label: string;
    name: string;
    description: string;
    position: OverlayPosition;
    links: MapLink[];
    resources: MapResourceConfig[];
};

export const MAP_EMBED_SRC =
    'https://maps.google.com/maps?q=University%20of%20Toronto%20Mississauga&t=k&z=16&ie=UTF8&iwloc=&output=embed';

export const MAP_BUILDINGS: MapBuildingConfig[] = [
    {
        id: 'oph',
        label: 'OPH',
        name: 'Oscar Peterson Hall',
        description:
            'A major residential and dining anchor with the largest cluster of tracked food options on the dashboard.',
        position: {
            left: 9,
            top: 15,
            width: 22,
            height: 16,
            clipPath: 'polygon(8% 6%, 90% 0%, 100% 76%, 12% 100%, 0% 34%)',
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [
            { kind: 'food', id: '27', name: 'Grill over the Fire', fallbackValue: 1 },
            { kind: 'food', id: '28', name: "Chef's Table", fallbackValue: 1 },
            { kind: 'food', id: '29', name: 'Fresh Baked out of the Oven', fallbackValue: 1 },
            { kind: 'food', id: '30', name: 'Kettle Meal', fallbackValue: 1 },
            { kind: 'food', id: '31', name: 'Sammies', fallbackValue: 1 },
            { kind: 'food', id: '32', name: 'CRISP Fresh Salads', fallbackValue: 1 },
            { kind: 'food', id: '33', name: 'POP UP', fallbackValue: 1 },
            { kind: 'food', id: '34', name: 'FLEX BOWL', fallbackValue: 1 },
            { kind: 'food', id: '35', name: 'The Smoothie Bar', fallbackValue: 1 },
            { kind: 'food', id: '36', name: 'Baked', fallbackValue: 1 },
            { kind: 'food', id: '37', name: 'BODEGA', fallbackValue: 1 },
            { kind: 'food', id: '38', name: 'Oscar Café', fallbackValue: 1 },
            { kind: 'food', id: '39', name: 'C Store', fallbackValue: 1 },
            { kind: 'food', id: '40', name: 'Roasted and Steeped', fallbackValue: 1 },
            { kind: 'food', id: '41', name: 'Ah-So Sushi', fallbackValue: 1 },
        ],
    },
    {
        id: 'ib',
        label: 'IB',
        name: 'Instructional Building',
        description:
            'A classroom-heavy hub with a compact set of food options and strong student foot traffic throughout the day.',
        position: {
            left: 33,
            top: 18,
            width: 15,
            height: 12,
            clipPath: 'polygon(6% 0%, 100% 8%, 92% 100%, 0% 90%)',
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [
            { kind: 'food', id: '1', name: 'Subway', fallbackValue: 1 },
            { kind: 'food', id: '25', name: 'Quesada', fallbackValue: 1 },
            { kind: 'food', id: '26', name: 'Ah-So Sushi', fallbackValue: 1 },
        ],
    },
    {
        id: 'dv',
        label: 'DV',
        name: 'William G. Davis Building',
        description:
            'A large academic building with a dense food court, making it one of the strongest indicators of daytime campus activity.',
        position: {
            left: 51,
            top: 16,
            width: 20,
            height: 16,
            clipPath: 'polygon(2% 12%, 88% 0%, 100% 84%, 16% 100%, 0% 62%)',
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [
            { kind: 'food', id: '2', name: "Harvey's", fallbackValue: 7 },
            { kind: 'food', id: '5', name: 'Flex Bowl', fallbackValue: 3 },
            { kind: 'food', id: '6', name: 'Tex Mex Grill', fallbackValue: 3 },
            { kind: 'food', id: '7', name: 'Fresh Baked out of the Oven', fallbackValue: 3 },
            { kind: 'food', id: '8', name: 'FUSION8', fallbackValue: 3 },
            { kind: 'food', id: '9', name: "Chef's Table", fallbackValue: 3 },
            { kind: 'food', id: '10', name: 'Thai Express', fallbackValue: 3 },
            { kind: 'food', id: '11', name: 'Shawarma Rotisserie', fallbackValue: 3 },
            { kind: 'food', id: '12', name: 'CRISP Fresh Salads', fallbackValue: 3 },
            { kind: 'food', id: '13', name: 'SAMMIES', fallbackValue: 3 },
            { kind: 'food', id: '14', name: 'UTM Smoked Meat', fallbackValue: 3 },
            { kind: 'food', id: '15', name: 'Baked', fallbackValue: 3 },
            { kind: 'food', id: '16', name: 'Roasted & Steeped', fallbackValue: 3 },
            { kind: 'food', id: '17', name: 'BODEGA', fallbackValue: 3 },
            { kind: 'food', id: '18', name: 'Kettle Meal', fallbackValue: 3 },
            { kind: 'food', id: '19', name: 'Ah-So Sushi', fallbackValue: 3 },
        ],
    },
    {
        id: 'dh',
        label: 'DH',
        name: 'Deerfield Hall',
        description:
            'A classroom building with several tracked food venues, useful for showing how the map aggregates venue activity at the building level.',
        position: {
            left: 72,
            top: 16,
            width: 16,
            height: 12,
            clipPath: 'polygon(0% 14%, 88% 0%, 100% 78%, 12% 100%)',
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [
            { kind: 'food', id: '3', name: 'Starbucks', fallbackValue: 11 },
            { kind: 'food', id: '20', name: 'EuroBowl', fallbackValue: 11 },
            { kind: 'food', id: '21', name: 'European Sandwich', fallbackValue: 11 },
            { kind: 'food', id: '22', name: 'Fresh Baked out of the Oven', fallbackValue: 11 },
            { kind: 'food', id: '23', name: 'Baked', fallbackValue: 11 },
            { kind: 'food', id: '24', name: 'Kettle Meal', fallbackValue: 11 },
        ],
    },
    {
        id: 'kn',
        label: 'KN',
        name: 'Kaneff Centre',
        description:
            'A recognizable campus connector building that currently hosts one tracked food venue in the dashboard.',
        position: {
            left: 39,
            top: 41,
            width: 15,
            height: 11,
            clipPath: 'polygon(0% 22%, 88% 0%, 100% 70%, 18% 100%)',
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [{ kind: 'food', id: '4', name: 'Second Cup Café', fallbackValue: 3 }],
    },
    {
        id: 'cct',
        label: 'CCT',
        name: 'Communication, Culture & Technology Building',
        description:
            'A useful mixed building for the map demo because it lets us combine one food venue with the tracked CCT parking garage.',
        position: {
            left: 20,
            top: 52,
            width: 17,
            height: 13,
            clipPath: 'polygon(10% 0%, 100% 14%, 90% 100%, 0% 84%)',
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Parking', href: '/parking' },
        ],
        resources: [
            { kind: 'food', id: '43', name: 'Circuit Break Cafe', fallbackValue: 1 },
            { kind: 'parking', id: 'cct_garage', name: 'CCT Garage', fallbackValue: 50 },
        ],
    },
    {
        id: 'rawc',
        label: 'RAWC',
        name: 'Recreation, Athletics and Wellness Centre',
        description:
            'The athletics hub on campus and the clearest example of a building whose map status should be driven mainly by gym capacity.',
        position: {
            left: 61,
            top: 55,
            width: 22,
            height: 16,
            clipPath: 'polygon(8% 8%, 90% 0%, 100% 54%, 76% 100%, 0% 88%, 2% 20%)',
        },
        links: [
            { label: 'Open Gym', href: '/gym' },
            { label: 'Open Parking', href: '/parking' },
        ],
        resources: [
            { kind: 'gym', id: 'gyma', name: 'Gym A - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'gymb', name: 'Gym B - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'gymc', name: 'Gym C - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'weightroom', name: 'Weight Room - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'pool', name: 'Pool - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'tennis', name: 'Tennis Courts', fallbackValue: 50 },
        ],
    },
];
