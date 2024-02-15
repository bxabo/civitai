import { ActionIcon, Autocomplete, Badge, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { useHiddenPreferencesData, useToggleHiddenPreferences } from '~/hooks/hidden-preferences';

import { trpc } from '~/utils/trpc';

export function HiddenTagsSection() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const tags = useHiddenPreferencesData().hiddenTags;
  const hiddenTags = tags.filter((x) => x.hidden);

  const { data, isLoading } = trpc.tag.getAll.useQuery({
    entityType: ['Model'],
    query: debouncedSearch.toLowerCase().trim(),
  });
  const modelTags =
    data?.items
      .filter((x) => !hiddenTags.some((y) => y.id === x.id))
      .map(({ id, name }) => ({ id, value: name })) ?? [];

  const toggleHiddenMutation = useToggleHiddenPreferences();

  const handleToggleBlockedTag = async (tag: { id: number; name: string }) => {
    await toggleHiddenMutation.mutateAsync({ kind: 'tag', data: [tag] });
    setSearch('');
  };

  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Text weight={500}>Hidden Tags</Text>
      </Card.Section>
      <Card.Section withBorder sx={{ marginTop: -1 }}>
        <Autocomplete
          name="tag"
          ref={searchInputRef}
          placeholder="Search tags to hide"
          data={modelTags}
          value={search}
          onChange={setSearch}
          icon={isLoading ? <Loader size="xs" /> : <IconSearch size={14} />}
          onItemSubmit={(item: { value: string; id: number }) => {
            handleToggleBlockedTag({ id: item.id, name: item.value });
            searchInputRef.current?.focus();
          }}
          withinPortal
          variant="unstyled"
        />
      </Card.Section>
      <Card.Section inheritPadding py="md">
        <Stack spacing={5}>
          {hiddenTags.length > 0 && (
            <Group spacing={4}>
              {hiddenTags.map((tag) => (
                <Badge
                  key={tag.id}
                  sx={{ paddingRight: 3 }}
                  rightSection={
                    <ActionIcon
                      size="xs"
                      color="blue"
                      radius="xl"
                      variant="transparent"
                      onClick={() => handleToggleBlockedTag(tag)}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </Group>
          )}
          <Text color="dimmed" size="xs">
            {`We'll hide content with these tags throughout the site.`}
          </Text>
        </Stack>
      </Card.Section>
    </Card>
  );
}
