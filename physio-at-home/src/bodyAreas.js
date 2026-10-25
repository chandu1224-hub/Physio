// General-information content for the body-area guide. It describes commonly recognised causes of pain
// in plain language and is NOT a diagnosis. Have a qualified physiotherapist or doctor review every
// entry before launch, and edit it here (one place) rather than in the component.

// Shapes are drawn on a 200 x 420 canvas, centred on x = 100.
const mirror = (s) => (s.cx !== undefined ? { ...s, cx: 200 - s.cx } : { ...s, x: 200 - s.x - s.width });
const both = (s) => [s, mirror(s)];

export const BODY_AREAS = [
  {
    id: 'neck', label: 'Neck', views: ['front', 'back'],
    shapes: [{ t: 'rect', x: 89, y: 56, width: 22, height: 20, rx: 6 }],
    conditions: [
      { name: 'Neck strain or stiffness', meaning: 'The muscles and joints of the neck are overworked, often from long hours looking at a screen, an awkward sleeping position or a sudden movement. It usually settles over days to a few weeks.' },
      { name: 'Age-related neck wear (cervical spondylosis)', meaning: 'Gradual wear of the neck joints and discs. It tends to cause stiffness and aching that comes and goes, and is common with age.' },
      { name: 'Irritated nerve in the neck', meaning: 'A nerve leaving the neck is pinched or inflamed, which can send pain, tingling or weakness into the shoulder, arm or hand.' },
    ],
    seekCare: 'Neck pain after a fall or accident, a severe headache with fever and a stiff neck, weakness or numbness in both arms, or trouble walking.',
  },
  {
    id: 'shoulder', label: 'Shoulder', views: ['front', 'back'],
    shapes: both({ t: 'circle', cx: 55, cy: 86, r: 15 }),
    conditions: [
      { name: 'Rotator cuff irritation', meaning: 'The small tendons that steady the shoulder become sore from overuse or a strain. Lifting the arm or reaching behind you is often painful.' },
      { name: 'Shoulder impingement', meaning: 'Tissue gets pinched in the narrow space at the top of the shoulder when the arm is raised, causing a pinching ache.' },
      { name: 'Frozen shoulder', meaning: 'The joint becomes painful and gradually stiff, making everyday movements such as dressing difficult. It develops over weeks and can take months to ease.' },
    ],
    seekCare: 'Shoulder or arm pain together with chest pain, breathlessness, sweating or jaw pain (call emergency services), a visible deformity after an injury, or being unable to lift the arm at all.',
  },
  {
    id: 'chest', label: 'Chest', views: ['front'],
    shapes: [{ t: 'rect', x: 68, y: 88, width: 64, height: 38, rx: 10 }],
    conditions: [
      { name: 'Inflamed rib cartilage (costochondritis)', meaning: 'The cartilage joining the ribs to the breastbone becomes tender. Pressing on the area or taking a deep breath often makes it worse.' },
      { name: 'Chest wall muscle strain', meaning: 'Muscles between the ribs are strained by coughing, heavy lifting or a new workout. The pain changes with movement or breathing.' },
    ],
    seekCare: 'Chest pain should never be assumed to be muscular. Pressure or tightness, pain spreading to the arm or jaw, sweating or breathlessness needs emergency medical help immediately.',
  },
  {
    id: 'abdomen', label: 'Abdomen & core', views: ['front'],
    shapes: [{ t: 'rect', x: 72, y: 130, width: 56, height: 58, rx: 10 }],
    conditions: [
      { name: 'Abdominal muscle strain', meaning: 'A pulled muscle in the stomach wall from twisting, lifting or intense exercise. It hurts when you tighten the muscles or sit up.' },
      { name: 'Separated abdominal muscles (diastasis recti)', meaning: 'The two halves of the stomach muscles drift apart, most often during or after pregnancy, which can leave the core feeling weak.' },
      { name: 'Pelvic floor tension or weakness', meaning: 'The muscles supporting the pelvis are too tight or too weak, which can cause lower tummy or pelvic discomfort and bladder symptoms.' },
    ],
    seekCare: 'Sudden or severe tummy pain, vomiting, fever, blood in urine or stool, or any pain during pregnancy. These need a doctor rather than physiotherapy first.',
  },
  {
    id: 'upper-back', label: 'Upper back', views: ['back'],
    shapes: [{ t: 'rect', x: 68, y: 88, width: 64, height: 44, rx: 10 }],
    conditions: [
      { name: 'Postural muscle pain', meaning: 'Muscles between and around the shoulder blades tire from sitting or standing in one position for long periods.' },
      { name: 'Stiff mid-back joints', meaning: 'The small joints where the ribs meet the spine become stiff and sore, often with a deep, achy feeling when twisting or breathing in deeply.' },
    ],
    seekCare: 'Upper back pain with chest pain or breathlessness, fever, unexplained weight loss, or after a significant injury.',
  },
  {
    id: 'lower-back', label: 'Lower back', views: ['back'],
    shapes: [{ t: 'rect', x: 72, y: 136, width: 56, height: 50, rx: 10 }],
    conditions: [
      { name: 'Lower back muscle strain', meaning: 'The most common cause of back pain. Muscles or ligaments are overstretched by lifting, bending or long sitting, and it generally improves within a few weeks.' },
      { name: 'Disc problem (slipped disc)', meaning: 'A cushion between the spinal bones bulges and presses on nearby tissue. It can cause back pain that worsens with bending or sitting.' },
      { name: 'Sciatica', meaning: 'Irritation of the sciatic nerve sends pain, tingling or numbness from the lower back or buttock down the leg, usually on one side.' },
    ],
    seekCare: 'Loss of control of bladder or bowels, numbness around the groin or inner thighs, growing weakness in a leg, fever, or back pain after a significant injury.',
  },
  {
    id: 'elbow', label: 'Elbow', views: ['front', 'back'],
    shapes: both({ t: 'circle', cx: 49, cy: 160, r: 10 }),
    conditions: [
      { name: 'Tennis elbow', meaning: 'Tendons on the outer elbow become irritated by repeated gripping or wrist movements, not only from tennis. Lifting a cup or turning a door handle can hurt.' },
      { name: "Golfer's elbow", meaning: 'The same kind of tendon irritation on the inner side of the elbow, often linked to repeated gripping or flexing of the wrist.' },
    ],
    seekCare: 'Swelling or deformity after a fall, being unable to straighten the elbow, or numbness in the ring and little fingers.',
  },
  {
    id: 'wrist-hand', label: 'Wrist & hand', views: ['front', 'back'],
    shapes: both({ t: 'ellipse', cx: 46, cy: 236, rx: 12, ry: 26 }),
    conditions: [
      { name: 'Carpal tunnel syndrome', meaning: 'A nerve is squeezed at the wrist, causing tingling or numbness in the thumb, index and middle fingers, often worse at night.' },
      { name: 'Wrist sprain or tendon irritation', meaning: 'Ligaments or tendons are strained by a fall or repeated use, such as heavy typing or phone use. The thumb side is commonly affected.' },
    ],
    seekCare: 'An injury with visible deformity, numbness that does not go away, or a hot, swollen joint with fever.',
  },
  {
    id: 'hip', label: 'Hip & buttock', views: ['front', 'back'],
    shapes: both({ t: 'ellipse', cx: 79, cy: 206, rx: 18, ry: 16 }),
    conditions: [
      { name: 'Hip tendon or bursa irritation', meaning: 'Soft tissue at the side of the hip is inflamed, giving pain that is worse when lying on that side or climbing stairs.' },
      { name: 'Hip osteoarthritis', meaning: 'Gradual wear of the hip joint causing groin or hip pain and stiffness, especially in the morning or after sitting.' },
      { name: 'Deep buttock muscle pain (piriformis)', meaning: 'A tight muscle deep in the buttock aggravates nearby tissue and can feel like pain down the back of the leg.' },
    ],
    seekCare: 'Being unable to put weight on the leg after a fall, especially in older adults, or hip pain with fever or a hot, swollen joint.',
  },
  {
    id: 'knee', label: 'Knee', views: ['front', 'back'],
    shapes: both({ t: 'circle', cx: 80, cy: 302, r: 14 }),
    conditions: [
      { name: 'Pain around the kneecap (runner’s knee)', meaning: 'The kneecap does not glide smoothly, causing an ache at the front of the knee that is worse on stairs, squatting or after sitting for long.' },
      { name: 'Ligament or cartilage (meniscus) injury', meaning: 'Usually follows a twist or impact. It may cause swelling, a catching or locking feeling, or a sense that the knee gives way.' },
      { name: 'Knee osteoarthritis', meaning: 'Gradual wear of the joint surfaces causing stiffness and aching that tends to build over time, often with swelling after activity.' },
    ],
    seekCare: 'A knee that locks or gives way after an injury, a joint that is red, hot and swollen, fever, or being unable to bear weight.',
  },
  {
    id: 'calf-shin', label: 'Calf & shin', views: ['front', 'back'],
    shapes: both({ t: 'rect', x: 66, y: 322, width: 26, height: 54, rx: 10 }),
    conditions: [
      { name: 'Shin splints', meaning: 'An ache along the front of the shin from a sudden rise in running or jumping. It often eases with rest and builds up again when you resume activity.' },
      { name: 'Calf muscle strain', meaning: 'A pulled calf muscle, often felt as a sudden tightness or sharp pain during sprinting or pushing off.' },
    ],
    seekCare: 'Swelling, warmth or redness in one calf, especially after long travel or inactivity (this can be a blood clot), or sudden severe pain with inability to walk.',
  },
  {
    id: 'ankle-foot', label: 'Ankle & foot', views: ['front', 'back'],
    shapes: both({ t: 'ellipse', cx: 79, cy: 392, rx: 17, ry: 15 }),
    conditions: [
      { name: 'Ankle sprain', meaning: 'Ligaments are overstretched when the foot rolls inwards. Swelling and bruising usually follow.' },
      { name: 'Heel pain (plantar fasciitis)', meaning: 'The band under the foot becomes irritated, giving sharp heel pain with the first steps in the morning that often eases as you move.' },
      { name: 'Achilles tendon irritation', meaning: 'The tendon above the heel is sore from overuse, with stiffness and pain at the back of the ankle.' },
    ],
    seekCare: 'Being unable to bear weight, a visible deformity, severe swelling, numbness, or any foot wound if you have diabetes.',
  },
];

export const BODY_VIEWS = ['front', 'back'];
