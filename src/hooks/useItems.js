import { useState, useEffect } from 'react';
import { subscribeToItems } from '../services/items';

export function useItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToItems((data) => {
            setItems(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { items, loading, error };
}
