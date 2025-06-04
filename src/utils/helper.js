import { Groups } from '../models/groups.model.js';
import { SubCategories } from '../models/subCategories.model.js';

export async function findSubcategories(productName) {
    const groups = await Groups.find({ isDeleted: false }).select('name keywords');

    // Strict Match Check
    for (const group of groups) {
          if (Array.isArray(group.keywords)) {
              for (const keyword of group.keywords) {
                  const strictRegex = new RegExp(`\\b${keyword}\\b`, 'i'); 
                  if (strictRegex.test(productName)) {
                      const subcategory = await SubCategories.findOne({
                          group: group._id,
                          isDeleted: false
                      }).select('name _id slug heading image sr_no category');
                      if (subcategory) {             
                          return [subcategory];
                      }
                  }
              }
          }
    }

    // Partial/Fuzzy Match (if no exact match found)
    const matchedSubcategories = [];
    const seenSubcategoryIds = new Set();

    for (const group of groups) {
        if (Array.isArray(group.keywords)) {
            for (const keyword of group.keywords) {
                const partialRegex = new RegExp(`${keyword}`, 'i'); 

                if (
                    partialRegex.test(productName) ||
                    isSimilar(keyword, productName) ||
                    hasCommonNGrams(keyword, productName)
                ) {
                    const subcategories = await SubCategories.find({
                        group: group._id,
                        isDeleted: false
                    }).select('name _id slug heading image sr_no category');

                    subcategories.forEach(subcategory => {
                        if (!seenSubcategoryIds.has(subcategory._id.toString())) {
                            matchedSubcategories.push(subcategory);
                            seenSubcategoryIds.add(subcategory._id.toString());
                        }
                    });

                    if (matchedSubcategories.length >= 5) break;
                }
            }
        }
        if (matchedSubcategories.length >= 5) break;
    }
    
    return matchedSubcategories; 
}

// Fuzzy Matching with Levenshtein Distance
function isSimilar(keyword, productName) {
    const distance = levenshteinDistance(keyword.toLowerCase(), productName.toLowerCase());
    const similarityThreshold = Math.floor(keyword.length * 0.4); // 40% difference allowed
    return distance <= similarityThreshold || productName.toLowerCase().includes(keyword.toLowerCase());
}

// Levenshtein Distance Algorithm
function levenshteinDistance(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

function hasCommonNGrams(keyword, productName) {
    const nGrams = getNGrams(productName.toLowerCase(), 3);
    return nGrams.some(gram => keyword.toLowerCase().includes(gram));
}

function getNGrams(text, n) {
    const nGrams = [];
    for (let i = 0; i < text.length - n + 1; i++) {
        nGrams.push(text.slice(i, i + n));
    }
    return nGrams;
}
