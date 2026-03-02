import React from 'react';
import { Card, CardContent } from '../../components/ui/card';

export default function SystemTools() {
  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">System Tools</h3>
        <p>Track admin logs, broadcast messages, and view metrics.</p>
      </CardContent>
    </Card>
  );
}
