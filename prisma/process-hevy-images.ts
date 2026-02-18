import fs from 'fs';
import path from 'path';

// Parse exercise name from Hevy filename
// Format: [ID]-[Exercise-Name]_[BodyPart]_thumbnail@3x.jpg
function parseExerciseName(filename: string): string {
  // Remove extension
  let name = filename.replace(/\.(jpg|jpeg|png)$/i, '');

  // Remove thumbnail suffix
  name = name.replace(/_(small_)?thumbnail@3x$/i, '');

  // Remove ID prefix (numbers at start, can be multiple segments)
  name = name.replace(/^\d+-/, '');

  // Split by underscore - first part is usually exercise name
  const parts = name.split('_');
  let exerciseName = parts[0];

  // Clean up the name
  exerciseName = exerciseName
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return exerciseName;
}

// Normalize exercise names for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

// Match Hevy exercise name to our exercise name
function findMatchingExercise(
  hevyName: string,
  ourExercises: Array<{ name: string }>
): string | null {
  const normalizedHevy = normalizeName(hevyName);

  // Try exact match first
  for (const ex of ourExercises) {
    if (normalizeName(ex.name) === normalizedHevy) {
      return ex.name;
    }
  }

  // Try matching without equipment in parentheses (both sides)
  const hevyWithoutEquipment = normalizedHevy
    .replace(/\s*\([^)]+\)\s*/g, '')
    .trim();
  for (const ex of ourExercises) {
    const ourWithoutEquipment = normalizeName(ex.name)
      .replace(/\s*\([^)]+\)\s*/g, '')
      .trim();
    if (
      ourWithoutEquipment === hevyWithoutEquipment &&
      ourWithoutEquipment.length > 0
    ) {
      return ex.name;
    }
  }

  // Try matching core exercise name (remove variations)
  const hevyCore = normalizedHevy
    .replace(
      /\s*(version\s*\d+|male|female|on\s+bench|standing|seated|lying|kneeling)\s*/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  for (const ex of ourExercises) {
    const ourCore = normalizeName(ex.name)
      .replace(/\s*\([^)]+\)\s*/g, '')
      .replace(
        /\s*(version\s*\d+|male|female|on\s+bench|standing|seated|lying|kneeling)\s*/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();

    if (ourCore === hevyCore && ourCore.length > 0) {
      return ex.name;
    }
  }

  // Try partial match (contains) - but be more strict
  for (const ex of ourExercises) {
    const normalizedOur = normalizeName(ex.name);
    // Both should be substantial matches (at least 5 chars)
    if (normalizedHevy.length >= 5 && normalizedOur.length >= 5) {
      if (
        normalizedOur.includes(normalizedHevy) ||
        normalizedHevy.includes(normalizedOur)
      ) {
        // Check if it's a reasonable match (not too different in length)
        const lengthDiff = Math.abs(
          normalizedHevy.length - normalizedOur.length
        );
        if (
          lengthDiff <
          Math.max(normalizedHevy.length, normalizedOur.length) * 0.5
        ) {
          return ex.name;
        }
      }
    }
  }

  return null;
}

// Map Hevy body parts to our body parts
function mapBodyPart(hevyBodyPart: string): string {
  const lower = hevyBodyPart.toLowerCase();
  if (lower.includes('chest')) return 'Chest';
  if (lower.includes('back') || lower.includes('lats')) return 'Back';
  if (
    lower.includes('leg') ||
    lower.includes('thigh') ||
    lower.includes('hip') ||
    lower.includes('calf') ||
    lower.includes('calves')
  )
    return 'Legs';
  if (lower.includes('shoulder') || lower.includes('deltoid'))
    return 'Shoulders';
  if (
    lower.includes('arm') ||
    lower.includes('bicep') ||
    lower.includes('tricep') ||
    lower.includes('forearm')
  )
    return 'Arms';
  if (
    lower.includes('core') ||
    lower.includes('ab') ||
    lower.includes('waist') ||
    lower.includes('oblique')
  )
    return 'Core';
  return 'Full Body';
}

// Extract body part from filename
function extractBodyPart(filename: string): string {
  const match = filename.match(/_([A-Za-z-]+)_thumbnail/i);
  if (match) {
    return mapBodyPart(match[1]);
  }
  return 'Full Body';
}

// Extract equipment from exercise name
function extractEquipment(exerciseName: string): string {
  const lower = exerciseName.toLowerCase();
  if (lower.includes('barbell')) return 'Barbell';
  if (lower.includes('dumbbell')) return 'Dumbbell';
  if (lower.includes('cable')) return 'Cable';
  if (
    lower.includes('machine') ||
    lower.includes('lever') ||
    lower.includes('smith')
  )
    return 'Machine';
  if (lower.includes('kettlebell')) return 'Kettlebell';
  if (lower.includes('band')) return 'Band';
  if (
    lower.includes('bodyweight') ||
    lower.includes('push-up') ||
    lower.includes('pull-up') ||
    lower.includes('dip') ||
    lower.includes('plank') ||
    lower.includes('crunch') ||
    lower.includes('sit-up')
  )
    return 'Bodyweight';
  return 'Bodyweight';
}

async function main() {
  const hevyFolder =
    '/Users/leonrooney/Downloads/Hevy - Exercise Library_files';
  const publicExercisesFolder = path.join(
    process.cwd(),
    'public',
    'exercises',
    'hevy'
  );
  const exercisesFile = path.join(
    process.cwd(),
    'prisma',
    'exercises.bulk.json'
  );

  // Create public exercises folder if it doesn't exist
  if (!fs.existsSync(publicExercisesFolder)) {
    fs.mkdirSync(publicExercisesFolder, { recursive: true });
  }

  // Load our exercises
  const ourExercisesRaw = fs.readFileSync(exercisesFile, 'utf8');
  const ourExercises: Array<{
    name: string;
    bodyPart?: string;
    equipment?: string;
    mediaUrl?: string;
    instructions?: string;
  }> = JSON.parse(ourExercisesRaw);

  // Get all image files from Hevy folder
  const imageFiles = fs
    .readdirSync(hevyFolder)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

  console.log(`Found ${imageFiles.length} image files in Hevy folder`);
  console.log(`Found ${ourExercises.length} exercises in our database`);

  const matches: Array<{
    ourExercise: string;
    hevyFile: string;
    bodyPart: string;
  }> = [];
  const newExercises: Array<{
    name: string;
    bodyPart: string;
    equipment: string;
    hevyFile: string;
  }> = [];
  const unmatched: Array<{
    hevyFile: string;
    parsedName: string;
    bodyPart: string;
  }> = [];

  // Process each image file
  for (const imageFile of imageFiles) {
    const parsedName = parseExerciseName(imageFile);
    const bodyPart = extractBodyPart(imageFile);
    const equipment = extractEquipment(parsedName);

    const matchedExercise = findMatchingExercise(parsedName, ourExercises);

    if (matchedExercise) {
      matches.push({
        ourExercise: matchedExercise,
        hevyFile: imageFile,
        bodyPart,
      });
    } else {
      // Check if it's a close match we should add
      unmatched.push({
        hevyFile: imageFile,
        parsedName,
        bodyPart,
      });

      // Add as new exercise if it looks valid
      if (parsedName.length > 3 && parsedName.length < 80) {
        newExercises.push({
          name: parsedName,
          bodyPart,
          equipment,
          hevyFile: imageFile,
        });
      }
    }
  }

  console.log(`\nMatched ${matches.length} images to existing exercises`);
  console.log(`Found ${newExercises.length} potential new exercises`);
  console.log(`Unmatched: ${unmatched.length}`);

  // Copy images and update exercises
  let copied = 0;
  let updated = 0;

  for (const match of matches) {
    const sourcePath = path.join(hevyFolder, match.hevyFile);
    const destPath = path.join(publicExercisesFolder, match.hevyFile);
    const mediaUrl = `/exercises/hevy/${match.hevyFile}`;

    // Copy image
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      copied++;

      // Update exercise in our list
      const exercise = ourExercises.find((e) => e.name === match.ourExercise);
      if (exercise && !exercise.mediaUrl) {
        exercise.mediaUrl = mediaUrl;
        updated++;
      }
    }
  }

  // Add new exercises
  for (const newEx of newExercises) {
    const sourcePath = path.join(hevyFolder, newEx.hevyFile);
    const destPath = path.join(publicExercisesFolder, newEx.hevyFile);
    const mediaUrl = `/exercises/hevy/${newEx.hevyFile}`;

    // Copy image
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }

    // Add to exercises list
    ourExercises.push({
      name: newEx.name,
      bodyPart: newEx.bodyPart,
      equipment: newEx.equipment,
      mediaUrl,
      // instructions can be added later
    });
  }

  // Save updated exercises
  fs.writeFileSync(exercisesFile, JSON.stringify(ourExercises, null, 2));

  console.log(`\nCopied ${copied} images to public/exercises/hevy/`);
  console.log(`Updated ${updated} existing exercises with media URLs`);
  console.log(`Added ${newExercises.length} new exercises`);
  console.log(`\nSummary:`);
  console.log(`   - Total exercises now: ${ourExercises.length}`);
  console.log(
    `   - Exercises with media: ${ourExercises.filter((e) => e.mediaUrl).length}`
  );
  console.log(`\nNext steps:`);
  console.log(`   1. Review the new exercises in exercises.bulk.json`);
  console.log(`   2. Add instructions for new exercises if needed`);
  console.log(`   3. Run: npm run seed:exercises:bulk`);
}

main()
  .then(() => {
    console.log('\nProcessing complete.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
