// Database utility to fix corrupted customSections data
// Run this once to clean up any invalid customSections data



import { prisma } from '@/lib/prisma'

async function fixCustomSections() {
    try {
        console.log('🔧 Checking for resumes with invalid customSections...');
        
        // Find all resumes
        const resumes = await prisma.resume.findMany({
            select: {
                id: true,
                customSections: true
            }
        });

        console.log(`Found ${resumes.length} resumes to check...`);

        let fixedCount = 0;

        for (const resume of resumes) {
            let needsFix = false;
            let fixedData = '[]';

            // Check if customSections is null, undefined, or invalid JSON
            if (!resume.customSections) {
                needsFix = true;
                console.log(`❌ Resume ${resume.id}: customSections is null/undefined`);
            } else {
                try {
                    const parsed = JSON.parse(resume.customSections as string);
                    if (!Array.isArray(parsed)) {
                        needsFix = true;
                        console.log(`❌ Resume ${resume.id}: customSections is not an array`);
                    }
                } catch (error) {
                    needsFix = true;
                    console.log(`❌ Resume ${resume.id}: customSections has invalid JSON`);
                }
            }

            if (needsFix) {
                await prisma.resume.update({
                    where: { id: resume.id },
                    data: { customSections: fixedData }
                });
                fixedCount++;
                console.log(`✅ Fixed resume ${resume.id}`);
            }
        }

        console.log(`🎉 Fixed ${fixedCount} resumes with invalid customSections data`);
        
    } catch (error) {
        console.error('❌ Error fixing customSections:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixCustomSections();