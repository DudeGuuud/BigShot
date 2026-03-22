import { Dialog, Button, Flex, Text, ScrollArea, Box, Badge } from "@radix-ui/themes";
import { ClockIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useLastSeen } from "../hooks/useLastSeen";
import { formatDistanceToNow } from "date-fns";

interface TacticalTimelineModalProps {
  targetCharacterId: string;
  targetName?: string;
}

export function TacticalTimelineModal({ targetCharacterId, targetName }: TacticalTimelineModalProps) {
  const { timeline, loading, error } = useLastSeen(targetCharacterId);

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button variant="soft" size="2" color="blue" style={{ cursor: "pointer" }}>
          <MagnifyingGlassIcon /> Timeline
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 550, backgroundColor: "var(--color-panel-solid)" }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <ClockIcon /> Tactical Timeline
          </Flex>
          <Text size="2" color="gray" mt="1" as="p">
            Target tracking history for {targetName || "Target"} ({targetCharacterId.slice(0, 6)}...{targetCharacterId.slice(-4)})
          </Text>
        </Dialog.Title>

        {loading && (
          <Box py="5" style={{ textAlign: "center" }}>
            <Text color="gray">Initializing tracking sensors...</Text>
          </Box>
        )}

        {error && (
          <Box py="5" style={{ textAlign: "center" }}>
            <Text color="red">Sensor interference detected: {error}</Text>
          </Box>
        )}

        {!loading && !error && timeline.length === 0 && (
          <Box py="5" style={{ textAlign: "center" }}>
            <Text color="gray">No known activity for this target.</Text>
          </Box>
        )}

        {!loading && !error && timeline.length > 0 && (
          <ScrollArea type="always" scrollbars="vertical" style={{ height: 350, marginTop: "var(--space-4)" }}>
            <Flex direction="column" gap="4" pr="3">
              {timeline.map((event, idx) => (
                <Box key={idx} style={{ 
                  borderLeft: "2px solid var(--accent-a6)",
                  paddingLeft: "var(--space-3)",
                  marginLeft: "var(--space-2)",
                  position: "relative"
                }}>
                  {/* Timeline Node Dot */}
                  <div style={{
                    position: "absolute",
                    left: "-5px",
                    top: "4px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-9)"
                  }} />

                  <Flex justify="between" align="center" mb="1">
                    <Flex gap="2" align="center">
                      {event.type === 'Killmail' && <Badge color="red" variant="soft">Killmail</Badge>}
                      {event.type === 'Jump' && <Badge color="teal" variant="soft">Gate Jump</Badge>}
                      {event.type === 'Deposit' && <Badge color="blue" variant="soft">Item Deposit</Badge>}
                      {event.type === 'Withdraw' && <Badge color="orange" variant="soft">Item Withdraw</Badge>}
                    </Flex>
                    <Text size="1" color="gray">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </Text>
                  </Flex>

                    <Box mt="2">
                      {event.type === 'Killmail' && (
                        <Flex direction="column" gap="1">
                          <Text size="2"><b>Location:</b> <Text color="yellow">{event.locationName}</Text> <Text size="1" color="gray">({event.locationId})</Text></Text>
                          <Text size="2" color="gray">Killmail ID: <a href={`https://explorer.sui.io/object/${(event as any).id.split('-').pop()}?network=testnet`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-a11)'}}>View on Explorer</a></Text>
                        </Flex>
                      )}
                      {event.type === 'Jump' && (
                        <Flex direction="column" gap="1">
                          <Text size="2"><b>Arrival:</b> <Text color="yellow">{event.locationName}</Text></Text>
                          {event.txDigest && (
                            <Text size="2" color="gray">Tx: <a href={`https://explorer.sui.io/txblock/${event.txDigest}?network=testnet`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-a11)'}}>{event.txDigest.slice(0, 8)}...</a></Text>
                          )}
                        </Flex>
                      )}
                      {(event.type === 'Deposit' || event.type === 'Withdraw') && (
                        <Flex direction="column" gap="1">
                          <Text size="2"><b>Sector/Unit:</b> <Text color="yellow">{event.locationName}</Text></Text>
                          {event.txDigest && (
                            <Text size="2" color="gray">Tx: <a href={`https://explorer.sui.io/txblock/${event.txDigest}?network=testnet`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-a11)'}}>{event.txDigest.slice(0, 8)}...</a></Text>
                          )}
                        </Flex>
                      )}
                    </Box>
                  <Text size="1" color="gray" mt="2" style={{ display: "block" }}>
                    {new Date(event.timestamp).toLocaleString()}
                  </Text>
                </Box>
              ))}
            </Flex>
          </ScrollArea>
        )}

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" style={{ cursor: "pointer" }}>
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
