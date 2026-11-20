// Illustrative CPWD Sewa organisational geography for the demo only.
// Zone -> Circle -> Division hierarchy. All names are representative / generic,
// not drawn from a live CPWD organisational chart.

export type Division = {
  id: string;
  name: string;
  seat: string; // representative city/station
  colonies: string[]; // sample GPRA-type colony names for drill-down
  weight: number; // relative share of circle's complaint volume
};

export type Circle = {
  id: string;
  name: string;
  divisions: Division[];
};

export type Zone = {
  id: string;
  name: string;
  color: string; // categorical slot used on the map
  states: string[]; // state/UT names (matches india_zones.json NAME_1) grouped under this zone
  circles: Circle[];
  weight: number; // relative share of national volume
};

function div(id: string, name: string, seat: string, colonies: string[], weight = 1): Division {
  return { id, name, seat, colonies, weight };
}

export const ZONES: Zone[] = [
  {
    id: "nz",
    name: "Northern Zone",
    color: "#2a78d6",
    states: ["Delhi", "Haryana", "Punjab", "Himachal Pradesh", "Jammu and Kashmir", "Chandigarh"],
    weight: 1.35,
    circles: [
      {
        id: "nz-c1",
        name: "Delhi Circle I",
        divisions: [
          div("nz-c1-d1", "New Delhi Division", "New Delhi", ["Sarojini Nagar Colony", "Netaji Nagar Colony", "Kidwai Nagar (New)"], 1.2),
          div("nz-c1-d2", "R.K. Puram Division", "R.K. Puram", ["Sector 3 GPRA Colony", "Sector 5 GPRA Colony", "Sector 8 GPRA Colony"], 1.1),
          div("nz-c1-d3", "Lodhi Road Division", "Lodhi Road", ["Lodhi Colony", "Bapa Nagar Colony", "Kasturba Nagar Colony"], 1),
        ],
      },
      {
        id: "nz-c2",
        name: "Delhi Circle II",
        divisions: [
          div("nz-c2-d1", "East Kidwai Nagar Division", "Kidwai Nagar", ["Kidwai Nagar (East) Colony", "Laxmi Bai Nagar Colony"], 1),
          div("nz-c2-d2", "Pragati Vihar Division", "Pragati Vihar", ["Pragati Vihar Hostel Complex", "Mayur Vihar Colony"], 0.9),
          div("nz-c2-d3", "Dwarka Division", "Dwarka", ["Sector 10 Dwarka Colony", "Sector 19 Dwarka Colony"], 0.85),
        ],
      },
      {
        id: "nz-c3",
        name: "Chandigarh Circle",
        divisions: [
          div("nz-c3-d1", "Chandigarh Division", "Chandigarh", ["Sector 24 Colony", "Sector 27 Colony"], 0.6),
          div("nz-c3-d2", "Panchkula Division", "Panchkula", ["Sector 4 Colony", "Sector 11 Colony"], 0.5),
          div("nz-c3-d3", "Shimla Division", "Shimla", ["Chhota Shimla Colony", "Kasumpti Colony"], 0.4),
        ],
      },
    ],
  },
  {
    id: "wz",
    name: "Western Zone",
    color: "#eb6834",
    states: ["Rajasthan", "Gujarat", "Maharashtra", "Goa", "Dadra and Nagar Haveli", "Daman and Diu"],
    weight: 1.05,
    circles: [
      {
        id: "wz-c1",
        name: "Mumbai Circle",
        divisions: [
          div("wz-c1-d1", "Mumbai Division I", "Mumbai", ["Colaba GPRA Colony", "Worli Colony"], 1.05),
          div("wz-c1-d2", "Mumbai Division II", "Mumbai", ["Bandra Colony", "Antop Hill Colony"], 0.95),
          div("wz-c1-d3", "Pune Division", "Pune", ["Shivajinagar Colony", "Pimpri Colony"], 0.8),
        ],
      },
      {
        id: "wz-c2",
        name: "Ahmedabad Circle",
        divisions: [
          div("wz-c2-d1", "Ahmedabad Division", "Ahmedabad", ["Navrangpura Colony", "Bapunagar Colony"], 0.75),
          div("wz-c2-d2", "Gandhinagar Division", "Gandhinagar", ["Sector 7 Colony", "Sector 16 Colony"], 0.6),
          div("wz-c2-d3", "Surat Division", "Surat", ["Athwa Colony", "Adajan Colony"], 0.55),
        ],
      },
      {
        id: "wz-c3",
        name: "Jaipur Circle",
        divisions: [
          div("wz-c3-d1", "Jaipur Division", "Jaipur", ["Malviya Nagar Colony", "C-Scheme Colony"], 0.65),
          div("wz-c3-d2", "Jodhpur Division", "Jodhpur", ["Shastri Nagar Colony", "Ratanada Colony"], 0.5),
          div("wz-c3-d3", "Udaipur Division", "Udaipur", ["Fatehpura Colony", "Hiran Magri Colony"], 0.4),
        ],
      },
    ],
  },
  {
    id: "sz",
    name: "Southern Zone",
    color: "#1baf7a",
    states: ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Puducherry"],
    weight: 0.95,
    circles: [
      {
        id: "sz-c1",
        name: "Bengaluru Circle",
        divisions: [
          div("sz-c1-d1", "Bengaluru Division I", "Bengaluru", ["Koramangala Colony", "Indiranagar Colony"], 0.95),
          div("sz-c1-d2", "Bengaluru Division II", "Bengaluru", ["Jayanagar Colony", "Rajajinagar Colony"], 0.85),
          div("sz-c1-d3", "Mysuru Division", "Mysuru", ["Vijayanagar Colony", "Saraswathipuram Colony"], 0.5),
        ],
      },
      {
        id: "sz-c2",
        name: "Chennai Circle",
        divisions: [
          div("sz-c2-d1", "Chennai Division I", "Chennai", ["Anna Nagar Colony", "T. Nagar Colony"], 0.9),
          div("sz-c2-d2", "Chennai Division II", "Chennai", ["Adyar Colony", "Guindy Colony"], 0.75),
          div("sz-c2-d3", "Puducherry Division", "Puducherry", ["Lawspet Colony", "Muthialpet Colony"], 0.35),
        ],
      },
      {
        id: "sz-c3",
        name: "Hyderabad Circle",
        divisions: [
          div("sz-c3-d1", "Hyderabad Division I", "Hyderabad", ["Begumpet Colony", "Ameerpet Colony"], 0.8),
          div("sz-c3-d2", "Hyderabad Division II", "Hyderabad", ["Malakpet Colony", "Lingampally Colony"], 0.65),
          div("sz-c3-d3", "Vijayawada Division", "Vijayawada", ["Governorpet Colony", "Benz Circle Colony"], 0.45),
        ],
      },
    ],
  },
  {
    id: "ez",
    name: "Eastern Zone",
    color: "#eda100",
    states: ["West Bengal", "Orissa", "Bihar", "Jharkhand", "Andaman and Nicobar"],
    weight: 0.85,
    circles: [
      {
        id: "ez-c1",
        name: "Kolkata Circle",
        divisions: [
          div("ez-c1-d1", "Kolkata Division I", "Kolkata", ["Salt Lake Colony", "Alipore Colony"], 0.85),
          div("ez-c1-d2", "Kolkata Division II", "Kolkata", ["Dum Dum Colony", "Behala Colony"], 0.7),
          div("ez-c1-d3", "Bhubaneswar Division", "Bhubaneswar", ["Unit IX Colony", "Nayapalli Colony"], 0.45),
        ],
      },
      {
        id: "ez-c2",
        name: "Patna Circle",
        divisions: [
          div("ez-c2-d1", "Patna Division", "Patna", ["Kidwaipuri Colony", "Rajendra Nagar Colony"], 0.55),
          div("ez-c2-d2", "Ranchi Division", "Ranchi", ["Doranda Colony", "Harmu Colony"], 0.4),
          div("ez-c2-d3", "Jamshedpur Division", "Jamshedpur", ["Sakchi Colony", "Kadma Colony"], 0.35),
        ],
      },
      {
        id: "ez-c3",
        name: "Port Blair Circle",
        divisions: [
          div("ez-c3-d1", "Port Blair Division", "Port Blair", ["Haddo Colony", "Delanipur Colony"], 0.2),
          div("ez-c3-d2", "Siliguri Division", "Siliguri", ["Hakimpara Colony", "Pradhan Nagar Colony"], 0.3),
          div("ez-c3-d3", "Cuttack Division", "Cuttack", ["Buxi Bazar Colony", "Mangalabag Colony"], 0.3),
        ],
      },
    ],
  },
  {
    id: "cz",
    name: "Central Zone",
    color: "#e87ba4",
    states: ["Madhya Pradesh", "Uttar Pradesh", "Chhattisgarh", "Uttaranchal"],
    weight: 1.1,
    circles: [
      {
        id: "cz-c1",
        name: "Lucknow Circle",
        divisions: [
          div("cz-c1-d1", "Lucknow Division I", "Lucknow", ["Gomti Nagar Colony", "Indira Nagar Colony"], 0.95),
          div("cz-c1-d2", "Lucknow Division II", "Lucknow", ["Aliganj Colony", "Alambagh Colony"], 0.8),
          div("cz-c1-d3", "Kanpur Division", "Kanpur", ["Swaroop Nagar Colony", "Kidwai Nagar Colony"], 0.65),
        ],
      },
      {
        id: "cz-c2",
        name: "Bhopal Circle",
        divisions: [
          div("cz-c2-d1", "Bhopal Division", "Bhopal", ["Arera Colony", "Shahpura Colony"], 0.6),
          div("cz-c2-d2", "Indore Division", "Indore", ["Palasia Colony", "Vijay Nagar Colony"], 0.55),
          div("cz-c2-d3", "Jabalpur Division", "Jabalpur", ["Napier Town Colony", "Wright Town Colony"], 0.35),
        ],
      },
      {
        id: "cz-c3",
        name: "Dehradun Circle",
        divisions: [
          div("cz-c3-d1", "Dehradun Division", "Dehradun", ["Rajpur Road Colony", "Ballupur Colony"], 0.4),
          div("cz-c3-d2", "Raipur Division", "Raipur", ["Shankar Nagar Colony", "Civil Lines Colony"], 0.45),
          div("cz-c3-d3", "Allahabad Division", "Prayagraj", ["Civil Lines Colony", "Tagore Town Colony"], 0.5),
        ],
      },
    ],
  },
  {
    id: "nez",
    name: "North-Eastern Zone",
    color: "#6250d6",
    states: ["Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"],
    weight: 0.45,
    circles: [
      {
        id: "nez-c1",
        name: "Guwahati Circle",
        divisions: [
          div("nez-c1-d1", "Guwahati Division", "Guwahati", ["Dispur Colony", "Zoo Road Colony"], 0.55),
          div("nez-c1-d2", "Shillong Division", "Shillong", ["Laitumkhrah Colony", "Nongthymmai Colony"], 0.35),
          div("nez-c1-d3", "Imphal Division", "Imphal", ["Lamphelpat Colony", "Chingmeirong Colony"], 0.3),
        ],
      },
      {
        id: "nez-c2",
        name: "Agartala Circle",
        divisions: [
          div("nez-c2-d1", "Agartala Division", "Agartala", ["Krishna Nagar Colony", "Abhoynagar Colony"], 0.3),
          div("nez-c2-d2", "Aizawl Division", "Aizawl", ["Chaltlang Colony", "Zarkawt Colony"], 0.2),
          div("nez-c2-d3", "Kohima Division", "Kohima", ["PR Hill Colony", "Midland Colony"], 0.2),
        ],
      },
    ],
  },
];

export const ALL_DIVISIONS: Division[] = ZONES.flatMap((z) => z.circles.flatMap((c) => c.divisions));

export function stateToZoneColor(): Map<string, { zoneId: string; color: string; zoneName: string }> {
  const m = new Map<string, { zoneId: string; color: string; zoneName: string }>();
  for (const z of ZONES) {
    for (const s of z.states) m.set(s, { zoneId: z.id, color: z.color, zoneName: z.name });
  }
  return m;
}

export function findZone(zoneId: string) {
  return ZONES.find((z) => z.id === zoneId);
}
export function findCircle(circleId: string) {
  for (const z of ZONES) for (const c of z.circles) if (c.id === circleId) return { zone: z, circle: c };
  return undefined;
}
export function findDivision(divisionId: string) {
  for (const z of ZONES)
    for (const c of z.circles)
      for (const d of c.divisions) if (d.id === divisionId) return { zone: z, circle: c, division: d };
  return undefined;
}

// Returns the set of leaf division ids under a given node (zone / circle / division id).
export function leafDivisionsUnder(nodeId: string): Division[] {
  const z = findZone(nodeId);
  if (z) return z.circles.flatMap((c) => c.divisions);
  const c = findCircle(nodeId);
  if (c) return c.circle.divisions;
  const d = findDivision(nodeId);
  if (d) return [d.division];
  return [];
}

export function nodeLabel(nodeId: string): string {
  const z = findZone(nodeId);
  if (z) return z.name;
  const c = findCircle(nodeId);
  if (c) return c.circle.name;
  const d = findDivision(nodeId);
  if (d) return d.division.name;
  return nodeId;
}
