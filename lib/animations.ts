export type AnimationPreset = 'customShapes' | 'schoolPride' | 'snow' | 'stars' | 'fireworks' | 'confettiRealistic';

export interface AnimationConfig {
  name: string;
  description: string;
  emoji: string;
  type: string;
}

export const ANIMATION_PRESETS: Record<AnimationPreset, AnimationConfig> = {
  confettiRealistic: {
    name: 'Realistische Confetti',
    description: 'Natuurlijke confetti explosie met meerdere bursts voor een authentiek effect',
    emoji: '🎊',
    type: 'confettiRealistic'
  },
  fireworks: {
    name: 'Vuurwerk Show',
    description: 'Spectaculaire vuurwerk explosies van beide kanten van het scherm',
    emoji: '🎆',
    type: 'fireworks'
  },
  customShapes: {
    name: 'Aangepaste Vormen',
    description: 'Pompoen, boom en hart vormen in verschillende kleuren',
    emoji: '🎃',
    type: 'customShapes'
  },
  schoolPride: {
    name: 'School Trots',
    description: 'Continue rode en witte confetti regen van beide kanten',
    emoji: '🏫',
    type: 'schoolPride'
  },
  snow: {
    name: 'Sneeuw',
    description: 'Zachte vallende sneeuwvlokken met realistische fysica',
    emoji: '❄️',
    type: 'snow'
  },
  stars: {
    name: 'Sterren Regen',
    description: 'Gouden sterren en cirkels in een prachtige explosie',
    emoji: '⭐',
    type: 'stars'
  }
};

// Store animation IDs for cleanup
let schoolPrideAnimationId: number | null = null;
let snowAnimationId: number | null = null;
let fireworksIntervalId: NodeJS.Timeout | null = null;

export const executeAnimation = (confetti: any, preset: AnimationPreset) => {
  // Clear any existing animations first
  stopAllAnimations();
  
  switch (preset) {
    case 'customShapes':
      executeCustomShapes(confetti);
      break;
    case 'schoolPride':
      executeSchoolPride(confetti);
      break;
    case 'snow':
      executeSnow(confetti);
      break;
    case 'stars':
      executeStars(confetti);
      break;
    case 'fireworks':
      executeFireworks(confetti);
      break;
    case 'confettiRealistic':
      executeConfettiRealistic(confetti);
      break;
  }
};

export const stopAllAnimations = () => {
  if (schoolPrideAnimationId) {
    cancelAnimationFrame(schoolPrideAnimationId);
    schoolPrideAnimationId = null;
  }
  if (snowAnimationId) {
    cancelAnimationFrame(snowAnimationId);
    snowAnimationId = null;
  }
  if (fireworksIntervalId) {
    clearInterval(fireworksIntervalId);
    fireworksIntervalId = null;
  }
};

// 1. Custom Shapes - EXACT CODE FROM TEMPLATE
const executeCustomShapes = (confetti: any) => {
  // pumpkin shape from https://thenounproject.com/icon/pumpkin-5253388/
  var pumpkin = confetti.shapeFromPath({
    path: 'M449.4 142c-5 0-10 .3-15 1a183 183 0 0 0-66.9-19.1V87.5a17.5 17.5 0 1 0-35 0v36.4a183 183 0 0 0-67 19c-4.9-.6-9.9-1-14.8-1C170.3 142 105 219.6 105 315s65.3 173 145.7 173c5 0 10-.3 14.8-1a184.7 184.7 0 0 0 169 0c4.9.7 9.9 1 14.9 1 80.3 0 145.6-77.6 145.6-173s-65.3-173-145.7-173zm-220 138 27.4-40.4a11.6 11.6 0 0 1 16.4-2.7l54.7 40.3a11.3 11.3 0 0 1-7 20.3H239a11.3 11.3 0 0 1-9.6-17.5zM444 383.8l-43.7 17.5a17.7 17.7 0 0 1-13 0l-37.3-15-37.2 15a17.8 17.8 0 0 1-13 0L256 383.8a17.5 17.5 0 0 1 13-32.6l37.3 15 37.2-15c4.2-1.6 8.8-1.6 13 0l37.3 15 37.2-15a17.5 17.5 0 0 1 13 32.6zm17-86.3h-82a11.3 11.3 0 0 1-6.9-20.4l54.7-40.3a11.6 11.6 0 0 1 16.4 2.8l27.4 40.4a11.3 11.3 0 0 1-9.6 17.5z',
    matrix: [0.020491803278688523, 0, 0, 0.020491803278688523, -7.172131147540983, -5.9016393442622945]
  });
  // tree shape from https://thenounproject.com/icon/pine-tree-1471679/
  var tree = confetti.shapeFromPath({
    path: 'M120 240c-41,14 -91,18 -120,1 29,-10 57,-22 81,-40 -18,2 -37,3 -55,-3 25,-14 48,-30 66,-51 -11,5 -26,8 -45,7 20,-14 40,-30 57,-49 -13,1 -26,2 -38,-1 18,-11 35,-25 51,-43 -13,3 -24,5 -35,6 21,-19 40,-41 53,-67 14,26 32,48 54,67 -11,-1 -23,-3 -35,-6 15,18 32,32 51,43 -13,3 -26,2 -38,1 17,19 36,35 56,49 -19,1 -33,-2 -45,-7 19,21 42,37 67,51 -19,6 -37,5 -56,3 25,18 53,30 82,40 -30,17 -79,13 -120,-1l0 41 -31 0 0 -41z',
    matrix: [0.03597122302158273, 0, 0, 0.03597122302158273, -4.856115107913669, -5.071942446043165]
  });
  // heart shape from https://thenounproject.com/icon/heart-1545381/
  var heart = confetti.shapeFromPath({
    path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
    matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333]
  });

  var defaults = {
    scalar: 2,
    spread: 180,
    particleCount: 30,
    origin: { y: -0.1 },
    startVelocity: -35
  };

  confetti({
    ...defaults,
    shapes: [pumpkin],
    colors: ['#ff9a00', '#ff7400', '#ff4d00']
  });
  confetti({
    ...defaults,
    shapes: [tree],
    colors: ['#8d960f', '#be0f10', '#445404']
  });
  confetti({
    ...defaults,
    shapes: [heart],
    colors: ['#f93963', '#a10864', '#ee0b93']
  });
};

// 2. School Pride - EXACT CODE FROM TEMPLATE
const executeSchoolPride = (confetti: any) => {
  var end = Date.now() + (15 * 1000);

  // go Buckeyes!
  var colors = ['#bb0000', '#ffffff'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors
    });

    if (Date.now() < end) {
      schoolPrideAnimationId = requestAnimationFrame(frame);
    } else {
      schoolPrideAnimationId = null;
    }
  })();
};

// 3. Snow - EXACT CODE FROM TEMPLATE
const executeSnow = (confetti: any) => {
  var duration = 15 * 1000;
  var animationEnd = Date.now() + duration;
  var skew = 1;

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  (function frame() {
    var timeLeft = animationEnd - Date.now();
    var ticks = Math.max(200, 500 * (timeLeft / duration));
    skew = Math.max(0.8, skew - 0.001);

    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: ticks,
      origin: {
        x: Math.random(),
        // since particles fall down, skew start toward the top
        y: (Math.random() * skew) - 0.2
      },
      colors: ['#ffffff'],
      shapes: ['circle'],
      gravity: randomInRange(0.4, 0.6),
      scalar: randomInRange(0.4, 1),
      drift: randomInRange(-0.4, 0.4)
    });

    if (timeLeft > 0) {
      snowAnimationId = requestAnimationFrame(frame);
    } else {
      snowAnimationId = null;
    }
  })();
};

// 4. Stars - EXACT CODE FROM TEMPLATE
const executeStars = (confetti: any) => {
  var defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star']
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle']
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
};

// 6. Fireworks - EXACT CODE FROM TEMPLATE
const executeFireworks = (confetti: any) => {
  var duration = 15 * 1000;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  fireworksIntervalId = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(fireworksIntervalId!);
      fireworksIntervalId = null;
      return;
    }

    var particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};

// 7. Confetti Realistic - EXACT CODE FROM TEMPLATE
const executeConfettiRealistic = (confetti: any) => {
  var count = 200;
  var defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};