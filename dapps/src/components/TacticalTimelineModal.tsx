import { Dialog, Flex, Text, ScrollArea, Box, Badge, Spinner, Button } from "@radix-ui/themes";
import { ClockIcon } from "@radix-ui/react-icons";
import { useLastSeen } from "../hooks/useLastSeen";
import { formatDistanceToNow } from "date-fns";

interface TacticalTimelineModalProps {
  targetCharacterId: string;
  targetName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TacticalTimelineModal({ targetCharacterId, targetName, open, onOpenChange }: TacticalTimelineModalProps) {
  const { timeline, loading, error } = useLastSeen(targetCharacterId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 550, backgroundColor: "var(--color-panel-solid)" }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <ClockIcon /> Tactical Timeline
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Target tracking history for {targetName || "Target"} ({targetCharacterId.slice(0, 6)}...{targetCharacterId.slice(-4)})
        </Dialog.Description>

        <ScrollArea scrollbars="vertical" style={{ height: 350, marginTop: 15 }}>
          <Box p="2">
            {loading ? (
              <Flex justify="center" align="center" style={{ height: 200 }}>
                <Spinner size="3" />
              </Flex>
            ) : error ? (
              <Box py="5" style={{ textAlign: "center" }}>
                <Text color="red">Sensor interference detected: {error}</Text>
              </Box>
            ) : timeline.length === 0 ? (
              <Box py="5" style={{ textAlign: "center" }}>
                <Text color="gray">No known activity for this target.</Text>
              </Box>
            ) : (
              <Flex direction="column" gap="4">
                {timeline.map((event, idx) => (
                  <Box key={idx} style={{ 
                    borderLeft: "2px solid var(--accent-a6)",
                    paddingLeft: "15px",
                    marginLeft: "10px",
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
                          <Text size="2" color="gray">Killmail ID: <a href={`https://explorer.sui.io/object/${(event.id || "").split('-').pop()}?network=testnet`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-a11)'}}>View on Explorer</a></Text>
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
            )}
          </Box>
        </ScrollArea>

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
