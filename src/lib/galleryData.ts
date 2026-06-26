import mongoose from 'mongoose';

// External DB Configuration
const EXTERNAL_URI = process.env.EXTERNAL_MONGODB_URI;
const FIREBASE_BUCKET = process.env.EXTERNAL_FIREBASE_BUCKET || 'artfactory-482402.firebasestorage.app';

// Helper to construct Firebase URL
export function getFirebaseUrl(path: string | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    // Encoding path segments to handle slashes correctly
    const encodedPath = encodeURIComponent(path);
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodedPath}?alt=media`;
}

export async function fetchGalleryData() {
    if (!EXTERNAL_URI) {
        console.warn('EXTERNAL_MONGODB_URI is missing. Skipping external sync.');
        return [];
    }

    let conn;
    try {
        console.log('Connecting to External Gallery DB:', EXTERNAL_URI.replace(/:([^:@]+)@/, ':****@'));
        // Create a separate connection for external DB
        conn = await mongoose.createConnection(EXTERNAL_URI).asPromise();
        console.log('Connected to External Gallery DB. Fetching artworks...');

        // Fetch approved artworks
        const artworks = await conn.collection('artworks').find({ status: 'approved' }).toArray();
        console.log(`Found ${artworks.length} approved artworks in External DB.`);

        if (artworks.length === 0) return [];

        // Group artworks by artist_id
        const artistMap = new Map();

        // Fetch related users (artists)
        // Collect all unique artist IDs
        const artistIds = [...new Set(artworks.map(a => a.artist_id).filter(Boolean))];
        console.log(`Found ${artistIds.length} unique artist IDs.`);

        // ⚠️ converting string IDs to ObjectId if needed
        const objectIds = artistIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (e) {
                console.warn(`Invalid ObjectId: ${id}`);
                return null;
            }
        }).filter(Boolean) as mongoose.Types.ObjectId[];

        const users = await conn.collection('users').find({
            _id: { $in: objectIds }
        }).toArray();

        console.log(`Found ${users.length} users (artists) in External DB.`);

        users.forEach(u => artistMap.set(u._id.toString(), u));

        // Group items by artist
        const ownersMap = new Map();

        artworks.forEach(art => {
            const artistId = art.artist_id?.toString();
            if (!artistId || !artistMap.has(artistId)) return;

            const artist = artistMap.get(artistId);

            if (!ownersMap.has(artistId)) {
                ownersMap.set(artistId, {
                    id: artistId, 
                    name: artist.name || 'Unknown Artist',
                    role: 'Artist',
                    bio: artist.artist_bio || artist.bio || 'No biography available.',
                    image: getFirebaseUrl(artist.avatar_url || artist.profile_image),
                    isSpotlight: artist.isSpotlight || false,
                    specialty: artist.artist_specialty || '',
                    items: []
                });
            }

            const owner = ownersMap.get(artistId);
            const wellnessTags = generateWellnessTags(
                art.title || '',
                art.description || '',
                art.style || 'None',
                art.subject || 'None'
            );

            owner.items.push({
                id: `ext-art-${art._id}`,
                type: 'ARTWORK',
                title: art.title,
                description: art.description || '',
                price: art.price ? `${art.price.toLocaleString()}` : 'Price on Request',
                rental: (art.rental_price !== undefined && art.rental_price !== null) ? `${art.rental_price.toLocaleString()}` : undefined,
                image: getFirebaseUrl(art.firebase_image_url || art.image_url),
                isCurated: art.isCurated || false,
                category: art.category || '회화',
                style: art.style || 'None',
                subject: art.subject || 'None',
                space: art.space || 'None',
                season: art.season || 'None',
                wellnessCategory: wellnessTags.wellnessCategory,
                balanceCategory: wellnessTags.balanceCategory,
                specs: {
                    material: art.material || art.category || 'Mixed Media',
                    year: art.year || (art.createdAt ? new Date(art.createdAt).getFullYear().toString() : '2025'),
                    size: art.size || '',
                    ho: art.ho || 0
                },
                canvasSize: art.width && art.height ? `${art.width} x ${art.height} cm` : (art.size ? `${art.size}호` : 'Various Sizes'),
                width: art.width,
                height: art.height,
                rentalStatus: (art.rental_status && art.rental_status !== 'undefined') ? art.rental_status : 'available',
                artistId: artistId
            });
        });

        const owners = Array.from(ownersMap.values());
        console.log(`Constructed ${owners.length} owners from External DB.`);

        return owners;

    } catch (error) {
        console.error('External Gallery DB Fetch Error:', error);
        return [];
    } finally {
        if (conn) {
            await conn.close();
        }
    }
}

// --- Dynamic Wellness Art Semantic Tagging Helper ---

export interface WellnessTags {
    wellnessCategory: 'sleep-relax' | 'energy' | 'recovery-kit';
    balanceCategory: 'Mental' | 'Sleep' | 'Physical' | 'Lifestyle';
}

export function generateWellnessTags(title: string, desc: string, style: string, subject: string): WellnessTags {
    const combinedText = `${title} ${desc} ${subject} ${style}`.toLowerCase();
    
    // 1. 수면/안정 및 정신/수면 지표 감지 (차분함, 밤, 바다, 달, 숲, 휴식 등)
    const calmKeywords = ['밤', '달', '바다', '숲', '휴식', '명상', '수면', '안정', 'sea', 'night', 'moon', 'forest', 'calm', 'sleep', 'relax', 'abstract', '추상'];
    const isCalm = calmKeywords.some(keyword => combinedText.includes(keyword)) || subject === '풍경' || subject === '기하학';

    // 2. 활력/에너지 및 신체/생활 지표 감지 (태양, 불꽃, 생명, 에너지, 꽃, 팝아트 등)
    const energeticKeywords = ['태양', '꽃', '생명', '에너지', '활력', '도전', '빛', 'sun', 'flower', 'energy', 'vibrant', 'pop', 'active'];
    const isEnergetic = energeticKeywords.some(keyword => combinedText.includes(keyword)) || style === '팝 아트';

    if (isCalm) {
        return {
            wellnessCategory: 'sleep-relax',
            balanceCategory: combinedText.includes('수면') ? 'Sleep' : 'Mental'
        };
    } else if (isEnergetic) {
        return {
            wellnessCategory: 'energy',
            balanceCategory: 'Physical'
        };
    } else {
        // 기본값: 보편적 회복 테마
        return {
            wellnessCategory: 'recovery-kit',
            balanceCategory: 'Lifestyle'
        };
    }
}

