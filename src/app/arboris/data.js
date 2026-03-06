"use client";
export const SAMPLE_FAMILY = {
  id: "root", name: "Elias Thornwood", born: "1891", died: "1967",
  photo: null, generation: 0, role: "Patriarch", location: "Yorkshire, England",
  isComplete: true,
  children: [
    {
      id: "c1", name: "Margaret Thornwood", born: "1918", died: "1998",
      generation: 1, location: "London, UK", isComplete: true, photo: null,
      spouse: "Harold Weston",
      children: [
        { id: "c1a", name: "Clara Weston", born: "1945", generation: 2, location: "Bristol, UK", isComplete: true, photo: null, children: [
          { id: "c1a1", name: "Sophie Weston", born: "1972", generation: 3, location: "Edinburgh, UK", isComplete: true, photo: null, children: [] },
          { id: "c1a2", name: "James Weston", born: "1975", generation: 3, location: "Bristol, UK", isComplete: false, photo: null, children: [] },
        ]},
        { id: "c1b", name: "Robert Weston", born: "1948", generation: 2, location: "Oxford, UK", isComplete: true, photo: null, children: [
          { id: "c1b1", name: "Liam Weston", born: "1978", generation: 3, location: "New York, USA", isComplete: true, photo: null, children: [] },
        ]},
      ],
    },
    {
      id: "c2", name: "Frederick Thornwood", born: "1921", died: "2003",
      generation: 1, location: "Manchester, UK", isComplete: true, photo: null,
      spouse: "Dorothy Price",
      children: [
        { id: "c2a", name: "Arthur Thornwood", born: "1950", generation: 2, location: "Manchester, UK", isComplete: true, photo: null, children: [
          { id: "c2a1", name: "Oliver Thornwood", born: "1980", generation: 3, location: "Toronto, CA", isComplete: true, photo: null, children: [] },
          { id: "c2a2", name: "Emma Thornwood", born: "1983", generation: 3, location: "Sydney, AU", isComplete: false, photo: null, children: [] },
        ]},
      ],
    },
    {
      id: "c3", name: "Harriet Thornwood", born: "1925",
      generation: 1, location: "Edinburgh, UK", isComplete: true, photo: null,
      spouse: "George Alderton",
      children: [
        { id: "c3a", name: "Violet Alderton", born: "1955", generation: 2, location: "Paris, FR", isComplete: false, photo: null, children: [] },
        { id: "c3b", name: "Thomas Alderton", born: "1958", generation: 2, location: "Berlin, DE", isComplete: true, photo: null, children: [
          { id: "c3b1", name: "Noah Alderton", born: "1989", generation: 3, location: "Berlin, DE", isComplete: true, photo: null, children: [] },
        ]},
      ],
    },
  ],
};

export const flattenFamily = (node, result = []) => {
  result.push(node);
  if (node.children) node.children.forEach(c => flattenFamily(c, result));
  return result;
};

export const ALL_MEMBERS = flattenFamily(SAMPLE_FAMILY);
