// Course data for Monsoon 2026, curated from:
//   CourseOfferings-M26-V5.pdf (17 Jul 2026)
//   Consolidated Lecture Time Table_M26 (2) (1).pdf
// Meetings use "Day+Period" tokens, e.g. "Mon1 Thu1". Periods are defined below.
// Day pattern: Mon/Thu = slot A, Tue/Fri = B, Wed/Sat = C — but meetings are
// stored per explicit day because the grid has real asymmetries.
// half: "H1" | "H2" | "H" (full-sem marker in doc) | null (regular full-sem).
// To update after a new PDF version: see CLAUDE.md.

(function () {
  "use strict";

  var PERIODS = [
    { n: 1, start: "08:30", end: "09:55" },
    { n: 2, start: "10:05", end: "11:30" },
    { n: 3, start: "11:40", end: "13:05" },
    { n: 4, start: "14:00", end: "15:25" },
    { n: 5, start: "15:35", end: "17:00" },
    { n: 6, start: "17:10", end: "18:40" }
  ];

  var COURSES = {};

  // def(code, name, ltpc, "Fac A + Fac B", {half, cap, cat:[], sec:{label: "Mon1 Thu1"}, note})
  // For single-section courses pass meet:"Mon1 Thu1" instead of sec.
  function def(code, name, ltpc, faculty, opts) {
    opts = opts || {};
    var sections = [];
    if (opts.sec) {
      Object.keys(opts.sec).forEach(function (label) {
        sections.push({ label: label, meetings: parseMeet(opts.sec[label]) });
      });
    } else if (opts.meet) {
      sections.push({ label: null, meetings: parseMeet(opts.meet) });
    }
    var credits = null;
    var m = /^(\d+)-(\d+)-(\d+)-(\d+)$/.exec(ltpc);
    if (m) credits = parseInt(m[4], 10);
    else if (/^(\d+)\s*Cr$/i.test(ltpc)) credits = parseInt(ltpc, 10);
    else if (/^0\s*Cr$/i.test(ltpc)) credits = 0;
    COURSES[code] = {
      code: code,
      name: name,
      ltpc: ltpc,
      credits: credits,
      faculty: faculty ? faculty.split(" + ") : [],
      area: code.replace(/[^A-Z].*$/, ""),
      half: opts.half || null,
      cap: opts.cap || null,
      categories: opts.cat || [],
      sections: sections,
      nonCourse: !!opts.nonCourse,
      note: opts.note || null
    };
  }

  function parseMeet(str) {
    return str.split(/\s+/).filter(Boolean).map(function (tok) {
      return { day: tok.slice(0, 3), period: parseInt(tok.slice(3), 10) };
    });
  }

  /* ---------------- UG first-year cores ---------------- */
  def("MA5.101", "Discrete Structures", "3-1-0-4", "Praveen P + Suryajith Ch",
      { sec: { "A": "Tue3 Fri3", "B": "Tue2 Fri2" } });
  def("CS0.101", "Computer Programming", "3-1-3-5", "Abhishek Deshpande + Vineet Gandhi + Charu Sharma",
      { meet: "Mon1 Thu1" });
  def("EC2.101", "Digital Systems and Microcontrollers", "3-1-3-5",
      "Anshu Sarje + Priyesh Shukla + Anil Kumar V + Madhava Krishna + Sourav Garg",
      { meet: "Mon2 Thu2" });
  def("MA4.101", "Real Analysis", "3-1-0-4", "Indranil Chakrabarthy + Uttam Singh + Lalitha V",
      { meet: "Tue1 Fri1" });
  def("EC5.101", "Networks, Signals and Systems", "3-1-0-4", "Prasad Krishnan + Aftab Hussain",
      { meet: "Mon3 Thu3" });
  def("EC2.102", "Electronic Workshop-1 (H2)", "2-0-3-2", "Praful Mankar + Saikiran B",
      { half: "H2", note: "Not on the consolidated lecture grid; schedule announced by the programme." });
  def("SC4.101", "Computing in Sciences-1 (H2)", "2-0-3-2", "Marimuthu Krishnan",
      { half: "H2", meet: "Mon3 Thu3" });
  def("CL1.101", "Introduction to Linguistics-1", "3-1-0-4", "Chiranjeevi Yarra + Radhika Mamidi",
      { meet: "Mon3 Fri3" });
  def("HS4.102", "Making of the Contemporary India", "3-1-0-4", "Aniket Alam + Aakansha Natani",
      { meet: "Tue3 Fri3" });
  def("HS7.101", "Human Sciences Lab-1 (H2)", "3-1-0-2", "Radhika Krishnan",
      { half: "H2", meet: "Mon3 Thu3" });
  def("GS0.101", "Spatial Thinking and Practice", "3-1-0-4", "Shaik Rehana + K S Rajan",
      { meet: "Mon3 Fri3" });
  def("OC2.101", "Arts-1 (H1)", "2-0-0-2", "Saroja T K (Coordinator)",
      { half: "H1", meet: "Wed2 Sat2", note: "Grid lists Arts-1 under H1 & H2." });
  def("OC3.101", "Value Education-1 (H)", "0-2-0-2", "Indranil Chakrabarty + Saurabh Todariya (Coordinators)",
      { half: "H", meet: "Wed3" });
  def("OC1.101", "Sports-1", "0-2-0-1", "Physical Education Centre",
      { note: "Scheduled by the Physical Education Centre; not on the lecture grid." });
  def("OC1.103", "Sports-3", "0-2-0-1", "Physical Education Centre",
      { note: "Scheduled by the Physical Education Centre; not on the lecture grid." });

  /* ---------------- UG second/third-year cores ---------------- */
  def("MA6.101", "Probability and Statistics", "3-1-0-4", "Tejas Bodas", { meet: "Wed2 Sat2" });
  def("MA6.102", "Probability and Random Processes", "3-1-0-4", "Praful Mankar", { meet: "Tue3 Fri3" });
  def("CS1.301", "Algorithm Analysis and Design", "3-1-0-4", "Girish Varma", { meet: "Mon1 Thu1" });
  def("CS3.301", "Operating Systems and Networks", "3-1-0-4", "Deepak Gangadharan", { meet: "Tue2 Fri2" });
  def("CS1.302", "Automata Theory (H1)", "3-1-0-2", "Shantanav Chakraborty",
      { half: "H1", meet: "Mon3 Thu3" });
  def("CS4.301", "Data and Applications (H2)", "3-1-0-2", "Kamal Karlapalem",
      { half: "H2", meet: "Mon3 Thu3 Mon5 Mon6",
        note: "Lecture Mon/Thu 11:40-13:05; lab Mon 15:35-18:40 per the grid." });
  def("EC3.202", "Embedded Systems Workshop (H)", "1-0-3-3",
      "Deepak Gangadharan + Sachin Chaudhari + Aftab Hussain",
      { half: "H", meet: "Mon4 Thu4 Thu5", note: "Lecture Mon 14:00; lab Thu 14:00-17:00 per the grid." });
  def("SC1.110a", "Science 1 (Section A: UG2 CSE/CSD)", "3-1-0-4",
      "Prabhakar Bhimalapuram + Samyadeb Bhattacharya", { meet: "Wed3 Sat3" });
  def("SC1.110b", "Science 1 (Section B: UG2 ECE/ECD, UG3 CLD/CHD/CGD)", "3-1-0-4",
      "Prabhakar Bhimalapuram + Samyadeb Bhattacharya", { meet: "Wed3 Sat3" });
  def("EC5.201", "Signal Processing", "3-1-3-5", "Santosh Nannuru", { meet: "Mon2 Thu2" });
  def("EC5.202", "Systems Thinking", "3-1-0-4", "Spandan Roy", { meet: "Tue4 Fri4" });
  def("EC2.201", "VLSI Design", "3-1-0-4", "Abhishek Srivastava", { meet: "Tue2 Fri2" });
  def("SC1.203", "Quantum Mechanics", "3-1-0-4", "Harjinder Singh", { meet: "Tue2 Fri2" });
  def("SC3.101", "Introduction to Biology", "3-1-0-4", "Vinod PK", { meet: "Mon2 Thu2" });
  def("SC4.110", "Science Lab I (H1)", "0-0-3-2", "Chittaranjan Hens + Tapan Kumar Sau",
      { half: "H1", meet: "Tue4 Tue5 Fri4 Fri5", note: "Grid: 14:00-17:00 lab block." });
  def("CL2.203", "Language and Society", "3-1-0-4", "Aditi Mukherjee", { meet: "Tue3 Fri3" });
  def("CL3.202", "Computational Linguistics II: Comp Semantics and Discourse parsing", "3-1-0-4",
      "Rajakrishnan P Rajkumar", { meet: "Tue1 Fri1" });
  def("HS0.216", "Thinking and Knowing in the Human Sciences - III", "3-1-0-4",
      "Anirban Dasgupta + Khaliq Parkar", { meet: "Tue3 Fri3" });
  def("HS0.202", "Thinking and Knowing in the Human Sciences - II", "3-1-0-4",
      "Rajorshi Ray + Isha Dubey", { meet: "Tue4 Fri4" });
  def("SC2.304", "Spectroscopy (H1)", "3-1-0-2", "Harjinder Singh", { half: "H1", meet: "Tue5 Fri5" });
  def("SC2.305", "Chemical Kinetics and Reaction Dynamics (H2)", "3-1-0-2", "Tapan Kumar Sau",
      { half: "H2", meet: "Tue5 Fri5" });
  def("SC3.202", "Bioinformatics (H1)", "3-1-0-2", "Nita Parekh", { half: "H1", meet: "Mon4 Thu4" });
  def("HS0.301", "Classical Text Readings", "3-1-0-4", "Ashwin Jayanti", { meet: "Mon2 Thu2" });
  def("HS0.203", "Basics of Ethics (H1 & H2)", "3-1-0-2", "Ashwin Jayanti + Saurabh Todariya",
      { half: "H", meet: "Wed1 Sat1",
        note: "Codes HS0.203a (H1) & HS0.203b (H2); same slot both halves." });

  /* ---------------- Math electives ---------------- */
  def("MA4.406", "Complex Analysis", "3-1-0-4", "Lakshmi Burra",
      { cap: 50, cat: ["math"], meet: "Tue3 Fri3", note: "Random selection." });
  def("MA6.501", "Advanced Probability Theory", "3-1-0-4", "Khushboo Agarwal",
      { cap: 50, cat: ["math"], meet: "Tue3 Fri3", note: "Random selection." });

  /* ---------------- Science electives ---------------- */
  def("SC3.321", "Biomolecular Structure Interaction & Dynamics", "3-1-0-4", "B.Gopalakrishnan",
      { cap: 35, cat: ["science"], meet: "Tue1 Fri1", note: "Prerequisites: ABA, GSC or equivalent. Random selection." });
  def("SC1.421", "Introduction to Quantum Field Theory", "3-1-0-4", "Subhadip Mitra + Monalisa Patra",
      { cap: 40, cat: ["science", "cnd"], meet: "Mon2 Thu2" });
  def("SC2.401", "Topics in Nanosciences", "3-1-0-4", "Tapan Kumar Sau",
      { cap: 60, cat: ["science", "cnd"], meet: "Mon2 Thu2" });
  def("SC2.309", "Chemistry Topics for Engineers", "3-1-0-4", "Prabhakar B + Tapan Kumar Sau",
      { cap: 120, cat: ["science"], meet: "Mon2 Thu2" });
  def("SC1.440", "Dynamical Processes in Complex Networks", "3-1-0-4", "Chittaranjan Hens",
      { cap: 40, cat: ["science", "cnd"], meet: "Mon2 Thu2" });
  def("SC1.415", "Physics of Early Universe", "3-1-0-4", "Diganta Das",
      { cap: 50, cat: ["science", "cnd"], meet: "Tue1 Fri1" });
  def("SC4.415", "Computer Aided Drug Design", "3-1-0-4", "Deva Priyakumar",
      { cat: ["science", "cnd"], meet: "Mon2 Thu2" });
  def("SC1.410", "Open Quantum Systems and Quantum Thermodynamics", "3-1-0-4", "Samyadeb Bhattacharya",
      { cap: 40, cat: ["science", "cnd"], meet: "Tue1 Fri1" });
  def("SC4.430", "Quantum Information Science", "3-1-0-4", "Siddhartha Das",
      { cat: ["science", "cnd"], meet: "Mon2 Thu2" });
  def("SC3.302", "Bioinformatics-II (H2)", "3-1-0-2", "Nita Parekh",
      { half: "H2", cat: ["cnd"], meet: "Tue2 Fri2" });

  /* ---------------- Humanities (HSS) electives, UG3 & UG4 ---------------- */
  def("HS5.202", "Introduction to Economics", "3-1-0-4", "Anirban Dasgupta",
      { cap: 40, cat: ["hss"], meet: "Tue5 Fri5" });
  def("HS1.210", "Music Workshop", "3-1-0-4", "Saroja TK",
      { cap: 35, cat: ["hss"], meet: "Tue5 Fri5" });
  def("HS3.201", "Introduction to History", "3-1-0-4", "Aniket Alam",
      { cap: 40, cat: ["hss"], meet: "Tue5 Fri5" });
  def("HS2.201", "Introduction to Sociology", "3-1-0-4", "Rajorshi Ray",
      { cap: 40, cat: ["hss"], meet: "Wed2 Sat2" });
  def("HS8.201", "Gender and Society", "3-1-0-4", "Sushmita Banerji",
      { cap: 40, cat: ["hss"], meet: "Tue5 Fri5" });
  def("HS1.304", "Environmental Humanities", "3-1-0-4", "Subha Chakraburtty",
      { cap: 60, cat: ["hss", "chd"], meet: "Wed2 Sat2" });
  def("CG1.401", "Introduction to Psychology", "3-1-0-4", "Priyanka Srivastava",
      { cap: 40, cat: ["hss"], meet: "Wed2 Sat2" });
  def("HS3.402", "Understanding Public and Digital History", "3-1-0-4", "Isha Dubey",
      { cap: 40, cat: ["hss", "chd"], meet: "Mon6 Thu6" });
  def("HS5.402", "Identity and Economic Development", "3-1-0-4", "Angarika Rakshit",
      { cap: 40, cat: ["hss", "chd"], meet: "Tue5 Fri5" });
  def("CS9.425", "Social Science Perspective on HCI", "3-1-0-4", "Nimmi Rangaswamy",
      { cap: 50, cat: ["hss", "chd", "open-ug"], meet: "Tue4 Fri4" });
  def("HS1.401", "Readings from Hindi Literature", "3-1-0-4", "Harjinder Singh",
      { cap: 40, cat: ["hss"], meet: "Mon6 Thu6" });

  /* ---------------- Bouquet courses (registration limit 150 unless noted) ---------------- */
  def("CS1.405", "Modern Complexity Theory", "3-1-0-4", "Suryajith Ch",
      { cap: 100, cat: ["bouquet-theory"], meet: "Mon3 Thu3" });
  def("CS1.402", "Principles of Programming Languages", "3-1-0-4", "Venkatesh Choppella",
      { cap: 100, cat: ["bouquet-theory"], meet: "Mon5 Thu5" });
  def("CS3.401", "Distributed Systems", "3-1-0-4", "Kishore Kothapalli",
      { cap: 100, cat: ["bouquet-systems"], meet: "Tue4 Fri4" });
  def("CS3.402", "Advanced Computer Networks", "3-1-0-4", "Ashok Kumar Das",
      { cap: 150, cat: ["bouquet-systems"], meet: "Mon3 Thu3" });
  def("CS7.403", "Statistical Methods in AI", "3-1-0-4", "Sai Kiran B + Anoop M Namboodiri",
      { cap: 200, cat: ["bouquet-ai", "ece-spc", "ece-vlsi", "ece-robotics"],
        sec: { "A": "Tue6 Fri6", "B": "Tue6 Fri6" } });
  def("CS4.406", "Information Retrieval & Extraction", "3-1-0-4", "Anil Nelakanti",
      { cap: 100, cat: ["bouquet-ai", "cld"], meet: "Mon5 Thu5" });
  def("CS7.501", "Advanced NLP", "3-1-0-4", "Manish Shrivastava",
      { cap: 100, cat: ["bouquet-ai"], meet: "Mon3 Thu3", note: "Core for UG3 CLD." });
  def("CS4.405", "Data Analytics I", "3-1-0-4", "Krishna Reddy Polepalli",
      { cap: 100, cat: ["bouquet-ai"], meet: "Mon1 Thu1" });
  def("CG1.402", "Intro to Cognitive Science", "3-1-0-4", "Bhaktee Dongaonkar + Bapi Raju S",
      { cap: 50, cat: ["bouquet-itx", "cld"], meet: "Mon4 Thu4" });
  def("GS2.401", "Spatial Informatics", "3-1-0-4", "RC Prasad + Kuldeep Kurte",
      { cap: 50, cat: ["bouquet-itx", "pg-case"], meet: "Tue4 Fri4", note: "Core for UG2 CGD." });

  /* ---------------- ECE electives (also count as CSE/Open) ---------------- */
  // Signal Processing & Communications stream
  def("EC5.415", "Information, Computation and Learning", "3-1-0-4", "Prasad Krishnan",
      { cat: ["ece-spc", "cse-open"], meet: "Tue2 Fri2" });
  def("CS7.404", "Digital Image Processing", "3-1-0-4", "Raghavendra GS",
      { cat: ["ece-spc", "ece-robotics", "cse-open"], meet: "Mon1 Thu1", note: "Core for UG3 CGD." });
  def("EC5.407", "Wireless Communications", "3-1-0-4", "Rajeev Gangula",
      { cat: ["ece-spc", "cse-open"], meet: "Mon3 Thu3" });
  def("EC5.406", "Signal Detection and Estimation Theory", "3-1-0-4", "Praful Mankar + Arti Yardi",
      { cat: ["ece-spc", "cse-open"], meet: "Mon4 Thu4" });
  def("EC5.413", "Quantum Error Correcting Codes", "3-1-0-4", "Lalitha V",
      { cat: ["ece-spc", "cse-open"], meet: "Mon1 Thu1" });
  // VLSI & Embedded Systems stream
  def("EC2.408", "Digital VLSI Design", "3-1-0-4", "Zia Abbas",
      { cat: ["ece-vlsi", "cse-open", "vlsi-mtech"], meet: "Tue4 Fri4" });
  def("EC2.410", "CMOS References and Regulators", "3-1-0-4", "Zia Abbas + Abhishek P",
      { cat: ["ece-vlsi", "cse-open", "vlsi-mtech"], meet: "Mon1 Thu1" });
  def("CS2.501", "Advanced Computer Architecture", "3-1-0-4", "Suresh Purini + Priyesh Shukla",
      { cat: ["ece-vlsi", "cse-open", "vlsi-mtech"], meet: "Wed1 Sat1" });
  def("EC2.409", "Principles of Semiconductor Devices", "3-1-0-4", "Aftab Hussain",
      { cat: ["ece-vlsi", "cse-open", "vlsi-mtech"], meet: "Mon3 Thu3" });
  def("CS2.401", "FPGA based Accelerator Design", "3-1-0-4", "Suresh Purini",
      { cat: ["ece-vlsi", "cse-open"], meet: "Tue4 Fri4" });
  def("EC2.414", "Advanced Memory Circuits and Systems", "3-1-0-4", "Priyesh Shukla",
      { cat: ["ece-vlsi", "cse-open"], meet: "Tue2 Fri2" });
  def("EC2.415", "Optoelectronics & Integrated Photonics", "3-1-0-4", "Tanmay Bhowmik",
      { cat: ["ece-vlsi", "cse-open"], meet: "Wed1 Sat1" });
  def("EC2.416", "Micro & Nano Fabrication Technology for ICs", "3-1-0-4", "HCU-Faculty",
      { cat: ["ece-vlsi", "cse-open", "vlsi-mtech"], meet: "Mon5 Thu5" });
  // Robotics stream
  def("CS7.503", "Mobile Robotics", "3-1-0-4", "K Madhava Krishna",
      { cat: ["ece-robotics", "cse-open"], meet: "Mon4 Thu4" });
  def("EC4.401", "Robotics: Dynamics and Control", "3-1-0-4", "Antony Thomas",
      { cat: ["ece-robotics", "cse-open"], meet: "Mon3 Thu3" });
  def("EC4.402", "Introduction to UAV Design", "3-1-0-4", "Harikumar K",
      { cat: ["ece-robotics", "cse-open"], meet: "Tue6 Fri6" });

  /* ---------------- CSE / Open electives ---------------- */
  def("CS8.501", "Research in Information Security", "3-1-0-4", "Srinathan Kannan + Ashok Kumar Das",
      { cat: ["cse-open"], meet: "Tue4 Fri4", note: "Core for M.Tech II yr CSIS." });
  def("CG3.401", "Introduction to Neural and Cognitive Modeling", "3-1-0-4", "Bapiraju Surampudi",
      { cat: ["cse-open"], meet: "Tue6 Fri6" });
  def("CG3.402", "Behavioral Research & Experimental Design", "3-1-0-4", "Vinoo Alluri",
      { cap: 50, cat: ["cse-open"], meet: "Tue2 Fri2" });
  def("CS6.501", "Topics in Software Engineering", "3-1-0-4", "Raghu Reddy Y",
      { cat: ["cse-open"], meet: "Tue4 Fri4" });
  def("CS1.408", "Introduction to Game Theory", "3-1-0-4", "Sujit Gujar",
      { cat: ["cse-open"], meet: "Tue2 Fri2" });
  def("CS9.429", "Design for Social Innovation", "3-1-0-4", "Ramesh Loganathan + Arjun Rajashekar",
      { cat: ["cse-open"], meet: "Wed1 Sat1" });
  def("CL2.405", "Speech Analysis and Linguistics", "3-1-0-4", "Chiranjeevi Yarra",
      { cat: ["cse-open", "cld"], meet: "Tue4 Fri4" });
  def("CG9.600", "Cognitive Science Seminar", "0 Cr", "Priyanka Srivastava + Bapi Raju",
      { cat: ["cse-open"], nonCourse: true, note: "Seminar; not on the lecture grid." });
  def("EC5.412", "Foundations for Signal Processing and Communication", "3-1-0-4",
      "Santosh Nannuru + Gowtham Kurri",
      { cat: ["cse-open"], meet: "Tue3 Fri3", note: "Open for MS & PhD students." });
  def("CS9.428", "Environmental Science & Technology", "3-1-0-4", "R C Prasad",
      { cat: ["cse-open", "pg-case"], meet: "Mon3 Thu3" });
  def("CG4.402", "Introduction to Neuroeconomics", "3-1-0-4", "Kavita Vemuri",
      { cat: ["cse-open"], meet: "Mon4 Thu4" });
  def("GS1.501", "Advanced Remote Sensing", "3-1-0-4", "RC Prasad + Kiran Chand T",
      { cat: ["cse-open"], meet: "Mon5 Thu5" });
  def("GS2.402", "Cyber GIS: Geospatial Web and GeoBI", "3-1-0-4", "K S Rajan + Kuldeep Kurte",
      { cap: 15, cat: ["cse-open"], meet: "Tue2 Fri2", note: "Core for UG3 CGD. Max 15 as an elective." });
  def("CL3.410", "Language Models and Agents", "3-1-0-4", "Vasudeva Varma",
      { cat: ["cse-open", "cld"], meet: "Mon4 Thu4" });
  def("CL3.411", "NLP for Healthcare", "3-1-0-4", "Parameshwari Krishnamurthy + Dipti M Sharma",
      { cat: ["cse-open", "cld"], meet: "Mon5 Thu5" });
  def("GS3.603", "Earth System Science and Modelling", "3-1-0-4", "Kiran Chand T",
      { cat: ["cse-open"], meet: "Tue4 Fri4", note: "GIS Stream / Open Elective." });
  def("CS6.403", "Autonomous Software Engineering (H2)", "3-1-0-2", "Karthik Vaidhyanathan",
      { half: "H2", cat: ["cse-open"], meet: "Mon4 Thu4" });
  def("CS7.510", "Diffusion Models for Generative AI", "3-1-0-4", "Naresh Manwani + Sai Kiran Bulusu",
      { cat: ["cse-open"], meet: "Mon4 Thu4" });
  def("CS9.442", "Topics in AI for Healthcare", "3-1-0-4", "Vinod PK + Bapi Raju S + Raja Poladi",
      { cat: ["cse-open"], meet: "Mon4 Thu4" });
  def("CS3.406", "Programming AI Accelerators", "3-1-0-4", "Girish Varma + P J Narayanan",
      { cat: ["cse-open"], meet: "Mon4 Thu4" });
  def("CL3.412", "Mechanistic Interpretability of Language Models (H2)", "3-1-0-2", "Hrishikesh Terdalkar",
      { half: "H2", cat: ["cse-open", "cld"], meet: "Tue6 Fri6" });
  def("CS5.501", "Scientific Visualisation", "3-1-0-4", "Raghavendra GS",
      { cat: ["cse-open"], meet: "Mon4 Thu4" });

  /* ---------------- Open electives only for UG ---------------- */
  def("CG1.403", "Learning and Memory", "3-1-0-4", "Bhaktee Dongaonkar",
      { cap: 70, cat: ["open-ug"], meet: "Tue3 Fri3" });
  def("CS3.306", "Algorithms and Operating Systems", "3-1-0-4", "Vikram Pudi",
      { cat: ["open-ug"], meet: "Mon5 Thu5", note: "Open Elective only for UG ECE/ECD students." });
  def("PD2.501", "Product Marketing", "3-1-0-4", "Ravi Warrier",
      { cap: 50, cat: ["open-ug", "pdm"], meet: "Tue1 Fri1" });
  def("PD1.402", "Service Design (H2)", "3-1-0-2", "Raman Saxena",
      { half: "H2", cap: 50, cat: ["open-ug", "pdm"], meet: "Mon5 Thu5" });
  def("PD2.405", "System Thinking and Design (H1)", "3-1-0-2", "Raman Saxena",
      { half: "H1", cap: 50, cat: ["open-ug", "pdm"], meet: "Mon5 Thu5" });
  def("PD2.402", "Early Stage Funding for a Startup (H2)", "3-1-0-2", "Sridhar Kalyanasundaram",
      { half: "H2", cap: 50, cat: ["open-ug", "pdm"], meet: "Mon6 Thu6" });
  def("PD3.401", "AI for Product Managers (H2)", "3-1-0-2", "Aditya T. (Guest Faculty) - Microsoft",
      { half: "H2", cap: 50, cat: ["open-ug", "pdm"], meet: "Wed1 Sat1" });
  def("PD1.301", "Design Thinking", "3-1-0-4", "Raman Saxena",
      { cap: 50, cat: ["open-ug"], meet: "Mon1 Thu1" });
  def("PD2.401", "Product Management", "3-1-0-4", "Ramesh Swaminathan",
      { cap: 50, cat: ["open-ug"], meet: "Wed2 Sat2" });
  def("PD2.421", "Business Fundamentals", "3-1-0-4", "Himanshu Warudkar",
      { cap: 50, cat: ["open-ug"], meet: "Sat4" });
  def("PD2.404", "Market Research and Validation (H1)", "3-1-0-2", "Ratan K Putla (Guest Faculty)",
      { half: "H1", cap: 50, cat: ["open-ug"], meet: "Wed1 Sat1" });

  /* ---------------- PG CASE electives ---------------- */
  def("CE1.607", "Earthquake Resistant Design of Masonry Structures", "3-1-0-4", "P Pravin Kumar Venkat Rao",
      { cat: ["pg-case"], meet: "Mon1 Thu1" });
  def("CE1.610", "Advanced Design of Steel Structures", "3-1-0-4", "Sunitha Palissery",
      { cat: ["pg-case"], meet: "Tue2 Fri2" });
  def("CE1.625", "Structural Safety of Built Infrastructure", "3-1-0-4", "Jofin George",
      { cat: ["pg-case"], meet: "Tue4 Fri4" });
  def("CE1.621", "Retrofitting of Existing Structures", "3-1-0-4", "Shubham Singhal",
      { cat: ["pg-case"], meet: "Mon4 Thu4" });

  /* ---------------- PG cores (dashboard visibility) ---------------- */
  def("CS1.304", "Data Structures & Algorithms for Problem Solving", "3-0-2-6", "Lini Thomas + Kshitij Gajjar",
      { meet: "Mon3 Thu3" });
  def("MA6.301", "Maths for Computer Science 1 - Probability and Statistics (H1)", "3-1-0-2", "Naresh Manvani",
      { half: "H1", meet: "Tue2 Fri2" });
  def("MA6.302", "Maths for Computer Science 2 - Linear Algebra (H2)", "3-1-0-2", "Pawan Kumar",
      { half: "H2", meet: "Tue2 Fri2" });
  def("CS6.302", "Software Systems Development", "3-0-2-4", "Abhishek Kr Singh", { meet: "Tue1 Fri1" });
  def("CS3.304", "Advanced Operating Systems", "3-1-0-4", "Krishna Reddy P", { meet: "Mon5 Thu5" });
  def("CS0.301", "Computer Problem Solving", "3-1-3-4", "Shatrunjay Rawat", { meet: "Mon1 Thu1" });
  def("CE1.501", "Structural Dynamics", "3-1-0-4", "Sunitha Palissery", { meet: "Mon3 Thu3" });
  def("CE4.501", "Finite Element Method", "3-1-0-4", "Jofin George", { meet: "Tue2 Fri2" });
  def("CE1.502", "Structural Engineering Design Studio", "3-1-0-4", "Shubham Singhal", { meet: "Mon2 Thu2" });
  def("CE0.501", "Theory of Elasticity", "3-1-0-4", "Pravin Kumar Venkat Rao", { meet: "Tue1 Fri1" });
  def("CE9.609", "IoT Workshop", "3-1-0-4", "Shruthi K + Sachin Chaudhari", { meet: "Tue3 Fri3" });

  /* ---------------- Honours / thesis / seminars (no grid slots) ----------------
     nonCourse: hidden from the dashboard and picker; still count toward the
     requirements panel and credit totals when a programme includes them. */
  def("CS9.302", "CSE-Honours-1", "0-2-6-2", "", { nonCourse: true });
  def("CS9.401", "BTP II", "0-2-6-2", "", { nonCourse: true });
  def("CS9.402", "CSE-Honours Project III", "0-2-6-2", "", { nonCourse: true });
  def("EC9.401", "BTP II (ECE)", "0-2-6-2", "", { nonCourse: true });
  def("EC9.402", "ECE-Honours Project III", "0-2-6-2", "", { nonCourse: true });
  def("SC9.302", "CNS Honors - 1", "0-2-6-2", "", { nonCourse: true });
  def("SC9.402", "CNS-Honours Project III", "0-2-6-2", "", { nonCourse: true });
  def("HS9.302", "HS-Honours-1", "0-2-6-2", "", { nonCourse: true });
  def("HS9.402", "HS-Honours Project-3", "0-2-6-2", "", { nonCourse: true });
  def("CL9.302", "CL-Honours-1", "0-2-6-2", "", { nonCourse: true });
  def("CL9.402", "CL-Honours Project III", "0-2-6-2", "", { nonCourse: true });
  def("GS9.302", "Honours Project-1 (CGD)", "0-2-6-2", "", { nonCourse: true });
  def("SC9.600", "CCNSB Seminar", "0 Cr", "Abhishek Deshpande", { nonCourse: true });
  def("OC9.600", "Institute Seminar", "1 Cr", "", { nonCourse: true });
  def("CS9.605", "Thesis (CSD)", "12 Cr", "", { nonCourse: true });
  def("EC9.605", "Thesis (ECD)", "12 Cr", "", { nonCourse: true });
  def("CL9.605", "Thesis (CLD)", "12 Cr", "", { nonCourse: true });
  def("SC9.605", "Thesis (CND)", "12 Cr", "", { nonCourse: true });
  def("HS9.605", "Thesis (CHD)", "12 Cr", "", { nonCourse: true });

  /* ---------------- Categories ---------------- */
  var CATEGORIES = {
    "math":            { label: "Maths Elective", group: "Electives" },
    "science":         { label: "Science Elective", group: "Electives" },
    "hss":             { label: "Humanities (HSS) Elective", group: "Electives" },
    "cse-open":        { label: "CSE / Open Elective", group: "Electives" },
    "open-ug":         { label: "Open Elective (UG only)", group: "Electives" },
    "bouquet-theory":  { label: "Bouquet - Theory", group: "Bouquet" },
    "bouquet-systems": { label: "Bouquet - Systems", group: "Bouquet" },
    "bouquet-ai":      { label: "Bouquet - AI", group: "Bouquet" },
    "bouquet-itx":     { label: "Bouquet - IT+X", group: "Bouquet" },
    "ece-spc":         { label: "ECE - Signal Processing & Comms", group: "ECE Streams" },
    "ece-vlsi":        { label: "ECE - VLSI & Embedded", group: "ECE Streams" },
    "ece-robotics":    { label: "ECE - Robotics", group: "ECE Streams" },
    "chd":             { label: "For CHD Students", group: "Branch Lists" },
    "cnd":             { label: "For CND Students", group: "Branch Lists" },
    "cld":             { label: "For CLD Students", group: "Branch Lists" },
    "pg-case":         { label: "PG CASE Elective", group: "PG Lists" },
    "pdm":             { label: "M.Tech PDM Elective", group: "PG Lists" },
    "vlsi-mtech":      { label: "M.Tech VLSI Area Elective", group: "PG Lists" }
  };

  /* ---------------- Programmes (UG) ----------------
     required = this semester's fixed core courses (auto-added on the grid).
     Elective requirements (HSS/Science/Maths/Bouquet/Star/Stream counts) are
     GRADUATION-level, not per-semester, so they are not enforced here — the
     builder only tracks the credit total. totalCredits = the programme's
     normal semester load from the offerings doc; going past it is overloading. */
  var PROGRAMMES = {
    "ug1-cse": { label: "B.Tech I yr - CSE / CSD", year: 1,
      required: ["MA5.101", "CS0.101", "EC2.101", "MA4.101", "OC2.101", "OC3.101", "OC1.101"],
      totalCredits: "23" },
    "ug1-ece": { label: "B.Tech I yr - ECE / ECD", year: 1,
      required: ["EC5.101", "CS0.101", "EC2.101", "MA4.101", "EC2.102", "OC2.101", "OC3.101", "OC1.101"],
      totalCredits: "25" },
    "ug1-cnd": { label: "B.Tech I yr - CND", year: 1,
      required: ["MA5.101", "CS0.101", "EC2.101", "MA4.101", "SC4.101", "OC2.101", "OC3.101", "OC1.101"],
      totalCredits: "25" },
    "ug1-cld": { label: "B.Tech I yr - CLD", year: 1,
      required: ["MA5.101", "CS0.101", "EC2.101", "CL1.101", "OC2.101", "OC3.101", "OC1.101"],
      totalCredits: "23" },
    "ug1-chd": { label: "B.Tech I yr - CHD", year: 1,
      required: ["MA5.101", "CS0.101", "EC2.101", "HS4.102", "HS7.101", "OC2.101", "OC3.101", "OC1.101"],
      totalCredits: "25" },
    "ug1-cgd": { label: "B.Tech I yr - CGD", year: 1,
      required: ["MA5.101", "CS0.101", "EC2.101", "GS0.101", "OC2.101", "OC3.101", "OC1.101"],
      totalCredits: "23" },

    "ug2-cse": { label: "B.Tech II yr - CSE / CSD", year: 2,
      required: ["MA6.101", "CS1.301", "CS3.301", "CS1.302", "CS4.301", "EC3.202", "SC1.110a", "OC1.103"],
      totalCredits: "24" },
    "ug2-ece": { label: "B.Tech II yr - ECE / ECD", year: 2,
      required: ["MA6.102", "EC5.201", "EC5.202", "EC2.201", "SC1.110b", "OC1.103"],
      totalCredits: "22" },
    "ug2-cnd": { label: "B.Tech II yr - CND", year: 2,
      required: ["MA6.102", "SC1.203", "SC3.101", "SC4.110", "CS1.301", "CS1.302", "CS4.301", "OC1.103"],
      totalCredits: "23" },
    "ug2-cld": { label: "B.Tech II yr - CLD", year: 2,
      required: ["MA6.101", "CL2.203", "CL3.202", "CS1.301", "CS1.302", "CS4.301", "OC1.103"],
      totalCredits: "21" },
    "ug2-chd": { label: "B.Tech II yr - CHD", year: 2,
      required: ["MA6.101", "HS0.216", "HS0.202", "CS1.301", "CS4.301", "CS1.302", "OC1.103"],
      totalCredits: "21" },
    "ug2-cgd": { label: "B.Tech II yr - CGD", year: 2,
      required: ["MA6.101", "CS4.301", "CS1.302", "CS1.301", "CS3.301", "GS2.401", "EC3.202", "OC1.103"],
      totalCredits: "24" },

    "ug3-cse": { label: "B.Tech III yr - CSE", year: 3,
      required: [], totalCredits: "16/18" },
    "ug3-csd": { label: "B.Tech III yr - CSD", year: 3,
      required: ["CS9.302"], totalCredits: "22" },
    "ug3-ece": { label: "B.Tech III yr - ECE", year: 3,
      required: [], totalCredits: "20/22" },
    "ug3-ecd": { label: "B.Tech III yr - ECD", year: 3,
      required: ["EC9.401"], totalCredits: "22" },
    "ug3-cnd": { label: "B.Tech III yr - CND", year: 3,
      required: ["CS3.301", "SC2.304", "SC2.305", "SC3.202", "SC9.302", "SC9.600"],
      totalCredits: "16" },
    "ug3-cld": { label: "B.Tech III yr - CLD", year: 3,
      required: ["CS3.301", "CS7.501", "CL9.302", "SC1.110b"], totalCredits: "22" },
    "ug3-chd": { label: "B.Tech III yr - CHD", year: 3,
      required: ["CS3.301", "HS0.301", "SC1.110b", "HS9.302"], totalCredits: "22" },
    "ug3-cgd": { label: "B.Tech III yr - CGD", year: 3,
      required: ["CS7.404", "MA4.101", "GS2.402", "SC1.110b", "GS9.302"], totalCredits: "22" },

    "ug4-cse": { label: "B.Tech IV yr - CSE", year: 4,
      required: ["HS0.203", "CS9.401"], totalCredits: "16" },
    "ug4-csd": { label: "B.Tech IV yr - CSD", year: 4,
      required: ["CS9.402", "HS0.203"], totalCredits: "20" },
    "ug4-ece": { label: "B.Tech IV yr - ECE", year: 4,
      required: ["HS0.203", "EC9.401"], totalCredits: "16" },
    "ug4-ecd": { label: "B.Tech IV yr - ECD", year: 4,
      required: ["EC9.402", "HS0.203"], totalCredits: "20" },
    "ug4-cnd": { label: "B.Tech IV yr - CND", year: 4,
      required: ["SC9.402", "HS0.203", "SC9.600"], totalCredits: "16" },
    "ug4-cld": { label: "B.Tech IV yr - CLD", year: 4,
      required: ["CL9.402", "HS0.203"], totalCredits: "20" },
    "ug4-chd": { label: "B.Tech IV yr - CHD", year: 4,
      required: ["HS9.402", "HS0.203"], totalCredits: "20" },

    "ug5-csd": { label: "B.Tech V yr - CSD", year: 5,
      required: ["CS9.605", "OC9.600"], totalCredits: "13" },
    "ug5-ecd": { label: "B.Tech V yr - ECD", year: 5,
      required: ["EC9.605", "OC9.600"], totalCredits: "13" },
    "ug5-cld": { label: "B.Tech V yr - CLD", year: 5,
      required: ["CL9.605", "OC9.600"], totalCredits: "13" },
    "ug5-cnd": { label: "B.Tech V yr - CND", year: 5,
      required: ["SC9.605", "SC9.600"], totalCredits: "16" },
    "ug5-chd": { label: "B.Tech V yr - CHD", year: 5,
      required: ["HS9.605", "OC9.600"], totalCredits: "13" }
  };

  window.COURSE_DATA = {
    meta: {
      semester: "Monsoon 2026 (2026-27 Semester I)",
      offeringsVersion: "V5 (17 July 2026)",
      timetableVersion: "M26",
      syllabusVersion: "V1 (09 July 2026)",
      startDate: "2026-08-01"
    },
    periods: PERIODS,
    courses: COURSES,
    categories: CATEGORIES,
    programmes: PROGRAMMES
  };
})();
