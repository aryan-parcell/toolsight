import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const MarketingRepository = {
    /**
     * Books a demo by adding to the 'demo_bookings' collection.
     */
    bookDemo: async (name: string, email: string, company: string, environment: string) => {
        return await addDoc(collection(db, "demo_bookings"), {
            name: name,
            email: email,
            company: company,
            environment: environment,
            status: "new",
            createdAt: serverTimestamp()
        });
    }
};
