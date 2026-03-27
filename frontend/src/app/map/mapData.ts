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

export type MapPolygon = {
    points: string;
    labelX: number;
    labelY: number;
    labelWidth?: number;
};

export type MapBuildingConfig = {
    id: string;
    label: string;
    name: string;
    description: string;
    polygon: MapPolygon;
    links: MapLink[];
    resources: MapResourceConfig[];
};

export const MAP_VIEWBOX = {
    width: 1200,
    height: 900,
} as const;

export const MAP_BUILDINGS: MapBuildingConfig[] = [
    {
        id: 'mn',
        label: 'MN',
        name: 'Maanjiwe Nendamowinan',
        description:
            'A west-side academic building represented through the Fair Trade Cafe signal.',
        polygon: {
            points: '192,168 276,122 352,164 334,292 254,362 176,316 158,228',
            labelX: 254,
            labelY: 238,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [{ kind: 'food', id: '42', name: 'Fair Trade Cafe', fallbackValue: 1 }],
    },
    {
        id: 'dh',
        label: 'DH',
        name: 'Deerfield Hall',
        description:
            'The southwest academic cluster anchored by Starbucks and the Deerfield food vendors.',
        polygon: {
            points: '166,350 286,332 314,426 278,510 176,486 146,404',
            labelX: 228,
            labelY: 422,
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
        id: 'oph',
        label: 'OPH',
        name: 'Oscar Peterson Hall',
        description:
            'A residence-side food zone that gives the southwest portion of campus a live dining signal.',
        polygon: {
            points: '304,650 372,622 432,676 356,742',
            labelX: 364,
            labelY: 682,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [
            { kind: 'food', id: '27', name: 'Grill over the Fire', fallbackValue: 1 },
            { kind: 'food', id: '28', name: "Chef's Table", fallbackValue: 1 },
            {
                kind: 'food',
                id: '29',
                name: 'Fresh Baked out of the Oven',
                fallbackValue: 1,
            },
            { kind: 'food', id: '30', name: 'Kettle Meal', fallbackValue: 1 },
            { kind: 'food', id: '31', name: 'Sammies', fallbackValue: 1 },
            { kind: 'food', id: '32', name: 'CRISP Fresh Salads', fallbackValue: 1 },
            { kind: 'food', id: '33', name: 'POP UP', fallbackValue: 1 },
            { kind: 'food', id: '34', name: 'FLEX BOWL', fallbackValue: 1 },
            { kind: 'food', id: '35', name: 'The Smoothie Bar', fallbackValue: 1 },
            { kind: 'food', id: '36', name: 'Baked', fallbackValue: 1 },
            { kind: 'food', id: '37', name: 'BODEGA', fallbackValue: 1 },
            { kind: 'food', id: '38', name: 'Oscar Cafe', fallbackValue: 1 },
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
            'The north-side classroom building with the compact Instructional Building food cluster.',
        polygon: {
            points: '470,90 664,72 716,132 676,206 494,186 446,122',
            labelX: 580,
            labelY: 138,
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
        id: 'ccit',
        label: 'CCIT',
        name: 'Communication, Culture, Information and Technology',
        description:
            'The library-side zone that ties together Circuit Break Cafe and the nearby CCT Garage.',
        polygon: {
            points: '700,208 804,196 840,298 822,398 742,428 688,352 688,252',
            labelX: 762,
            labelY: 306,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Parking', href: '/parking' },
        ],
        resources: [
            { kind: 'food', id: '43', name: 'Circuit Break Cafe', fallbackValue: 4 },
            { kind: 'parking', id: 'cct_garage', name: 'CCT Garage', fallbackValue: 70 },
        ],
    },
    {
        id: 'student',
        label: 'Student\nCentre',
        name: 'Student Centre',
        description:
            'The central student hub that bundles The Blind Duck Pub and Chatime into one stop.',
        polygon: {
            points: '520,610 606,584 646,704 618,812 530,782 496,680',
            labelX: 568,
            labelY: 694,
            labelWidth: 110,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [
            { kind: 'food', id: '44', name: 'The Blind Duck Pub', fallbackValue: 6 },
            { kind: 'food', id: '45', name: 'Chatime', fallbackValue: 4 },
        ],
    },
    {
        id: 'kn',
        label: 'KN',
        name: 'Kaneff Centre',
        description:
            'The south-central campus building that is currently represented by the Second Cup queue.',
        polygon: {
            points: '662,720 790,698 806,844 676,872 620,792',
            labelX: 716,
            labelY: 786,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [{ kind: 'food', id: '4', name: 'Second Cup Café', fallbackValue: 3 }],
    },
    {
        id: 'davis_rawc',
        label: 'Davis /\nRAWC',
        name: 'Davis Building and RAWC',
        description:
            'A combined southeast activity zone that merges Davis food traffic with the main RAWC gym signal.',
        polygon: {
            points:
                '802,694 968,662 1098,724 1088,924 934,944 822,916 766,838 774,762 852,748 850,694',
            labelX: 936,
            labelY: 810,
            labelWidth: 150,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Gym', href: '/gym' },
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
            { kind: 'gym', id: 'gyma', name: 'Gym A - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'gymb', name: 'Gym B - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'gymc', name: 'Gym C - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'weightroom', name: 'Weight Room - RAWC', fallbackValue: 50 },
            { kind: 'gym', id: 'pool', name: 'Pool - RAWC', fallbackValue: 50 },
        ],
    },
];
