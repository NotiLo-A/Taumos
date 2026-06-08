export interface Example {
  id: string;
  formulas: Array<{
    latex: string;
    color: string;
  }>;
  previewImage: string;
}

export const examples: Example[] = [
  {
    id: "example1",
    formulas: [
      { latex: "y=mx+b", color: "#2d70b3" },
      { latex: "m=2", color: "#388c46" },
      { latex: "b=1", color: "#6042a6" },
      { latex: "\\left(0,b\\right)", color: "#000000" },
      { latex: "\\left(1,b+m\\right)", color: "#c74440" },
      {
        latex:
          "\\operatorname{polygon}\\left(\\left(0,b\\right),\\left(1,b+m\\right),\\left(0,b+m\\right)\\right)",
        color: "#2d70b3",
      },
    ],
    previewImage: "/src/examples/previews/1.png",
  },
  {
    id: "example2",
    formulas: [
      { latex: "y=ax^{2}+bx+c", color: "#c74440" },
      { latex: "a=1", color: "#2d70b3" },
      { latex: "b=4", color: "#388c46" },
      { latex: "c=2", color: "#6042a6" },
      {
        latex: "\\left(-\\frac{b}{2a},-\\frac{b^{2}}{4a}+c\\right)",
        color: "#000000",
      },
      { latex: "\\left(0,c\\right)", color: "#000000" },
      { latex: "x=-\\frac{b}{2a}", color: "#fa7e19" },
      { latex: "y=bx+c", color: "#6042a6" },
    ],
    previewImage: "/src/examples/previews/2.png",
  },
  {
    id: "example3",
    formulas: [
      { latex: "x^{2}+y^{2}=1", color: "#c74440" },
      { latex: "\\left(\\cos a,\\ \\sin a\\right)", color: "#000000" },
      { latex: "a=45", color: "#388c46" },
      {
        latex:
          "\\operatorname{polygon}\\left(\\left(0,0\\right),\\left(\\cos\\left(a\\right),0\\right),\\left(\\cos\\left(a\\right),\\sin\\left(a\\right)\\right)\\right)",
        color: "#2d70b3",
      },
    ],
    previewImage: "/src/examples/previews/3.png",
  },
  {
    id: "example4",
    formulas: [
      {
        latex: "f\\left(x\\right)=a\\cos\\left(\\frac{2\\pi x}{p}\\right)",
        color: "#c74440",
      },
      { latex: "a=4", color: "#2d70b3" },
      { latex: "p=3", color: "#388c46" },
      { latex: "\\left(p,a\\right)", color: "#000000" },
      { latex: "\\left(p,\\ at\\right)", color: "#000000" },
      { latex: "\\left(pt,\\ a\\right)", color: "#000000" },
      { latex: "\\left(s,a\\right)", color: "#000000" },
      { latex: "f\\left(x-s\\right)", color: "#6042a6" },
      { latex: "s=0.01", color: "#fa7e19" },
    ],
    previewImage: "/src/examples/previews/4.png",
  },
  {
    id: "example5",
    formulas: [
      { latex: "x^{2}+\\left(y-\\sqrt{x^{2}}\\right)^{2}=1", color: "#c74440" },
    ],
    previewImage: "/src/examples/previews/5.png",
  },
];
