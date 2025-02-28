const db = require("./database");

const patients = [
  {
    age: 32,
    gender: "Female",
    history: "Pregnant",
    symptoms: "Mild bleeding and pain",
    additional_info: "Uterus is tender, fetal heart sounds are absent",
    correct_test: "Physical examination and ultrasound",
    correct_diagnosis: "Abruptio placenta"
  },
  {
    age: 5,
    gender: "Male",
    history: "Diagnosed with posterior superior retraction pocket",
    symptoms: "None specified",
    additional_info: "Posterior superior retraction pocket present",
    correct_test: "Otoscopy and audiometry",
    correct_diagnosis: "Chronic suppurative otitis media (unsafe type)"
  },
  {
    age: 48,
    gender: "Male",
    history: "None specified",
    symptoms: "Exquisitely painful, raised, red lesion on the dorsal surface of left hand",
    additional_info: "Histologic examination shows nests of round, regular cells within connective tissue associated with branching vascular spaces",
    correct_test: "Skin biopsy",
    correct_diagnosis: "Glomus tumor"
  },
  {
    age: 45,
    gender: "Male",
    history: "persistent cough",
    symptoms: "weight loss",
    additional_info: "smoker for many years",
    correct_test: "Chest x-ray",
    correct_diagnosis: "Lung cancer"
  },
];

// Insert data after ensuring the table exists
db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO patients (age, gender, history, symptoms, additional_info, correct_test, correct_diagnosis)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  patients.forEach((p) => {
    stmt.run(p.age, p.gender, p.history, p.symptoms, p.additional_info, p.correct_test, p.correct_diagnosis, (err) => {
      if (err) {
        console.error("Error inserting data:", err);
      } else {
        console.log("Inserted patient case:", p.correct_diagnosis);
      }
    });
  });

  stmt.finalize(() => {
    console.log("Seeding complete ✅");
    db.close();
  });
});
