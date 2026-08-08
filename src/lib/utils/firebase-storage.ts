export async function uploadImageToFirebase(base64Data: string, path: string): Promise<string> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/uploadImage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, path })
    });
    const data = await res.json();
    return data.url;
}
