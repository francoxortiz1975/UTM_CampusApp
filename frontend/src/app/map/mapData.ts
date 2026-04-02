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
    labelFontSize?: number;
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

/*
 * Building polygon coordinates are derived from real GPS positions projected
 * into the 1200x900 SVG viewbox.  The projection uses:
 *   lat  43.5475 -> 43.5525   (south -> north  =  y 820 -> y 80)
 *   lng -79.6680 -> -79.6590  (west  -> east   =  x 80  -> x 1120)
 */

export const MAP_BUILDINGS: MapBuildingConfig[] = [
    {
        id: 'mn',
        label: 'MN',
        name: 'Maanjiwe Nendamowinan',
        description:
            'A northwest academic building home to the Fair Trade Cafe and connected to Deerfield Hall.',
        polygon: {
            points: '178,248 280,244 286,275 280,306 178,310 172,280',
            labelX: 228,
            labelY: 278,
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
            'The northwest academic cluster anchored by Starbucks and the Deerfield food court.',
        polygon: {
            points: '205,340 322,336 328,370 322,404 205,408 198,374',
            labelX: 264,
            labelY: 372,
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
            'The residence dining hall on the west side of campus with a wide selection of food options.',
        polygon: {
            points: '214,598 304,594 310,625 304,656 214,660 208,630',
            labelX: 260,
            labelY: 628,
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
            'The large north-central classroom building with its own compact food cluster.',
        polygon: {
            points: '490,182 636,178 642,212 636,246 490,250 484,216',
            labelX: 562,
            labelY: 215,
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
            'The east-central technology building near the library, home to Circuit Break Cafe and CCT Garage.',
        polygon: {
            points: '628,396 728,392 734,428 728,462 628,466 622,432',
            labelX: 678,
            labelY: 430,
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
            'The central student hub on Inner Circle, home to The Blind Duck Pub and Chatime.',
        polygon: {
            points: '460,548 556,544 562,578 556,612 460,616 454,582',
            labelX: 508,
            labelY: 580,
            labelWidth: 110,
            labelFontSize: 14,
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
            'The south-central academic building on Inner Circle, home to Second Cup.',
        polygon: {
            points: '576,642 662,638 668,668 662,698 576,702 570,672',
            labelX: 618,
            labelY: 670,
        },
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        resources: [{ kind: 'food', id: '4', name: 'Second Cup Caf\u00e9', fallbackValue: 3 }],
    },
    {
        id: 'davis_rawc',
        label: 'Davis /\nRAWC',
        name: 'Davis Building and RAWC',
        description:
            'The large southeast complex combining Davis food court with the RAWC athletic centre.',
        polygon: {
            points: '790,618 950,614 958,650 954,708 932,728 802,732 786,712 782,656',
            labelX: 870,
            labelY: 672,
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
