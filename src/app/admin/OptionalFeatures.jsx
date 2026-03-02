import React from 'react';
import { Card, CardContent } from '../../components/ui/card';

export default function OptionalFeatures() {
  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Extra Features</h3>
        <p>Support tickets, data export, referral tracking, and more.</p>
      </CardContent>
    </Card>
  );
}
