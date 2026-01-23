import { VIDEO_URL } from "@/utils/token";
import { Image, Text, View } from "react-native";

// Updated interface to match API response
interface Notification {
  ID: string;
  senderID: string;
  recieverID: string;
  msg: string;
  type: string;
  CreatedDate: string;
  Status: string;
  senderFirstName: string;
  senderLastname: string;
  Image: string;
}

const NotificationCard = ({ item }: { item: Notification }) => {
  // const formatTimeAgo = (dateString: string) => {
  //   try {
  //     const date = parseISO(dateString);
  //     return formatDistanceToNow(date, { addSuffix: true });
  //   } catch (error) {
  //     console.error("Error parsing date:", error);
  //     return dateString;
  //   }
  // };

  const fullName = `${item.senderFirstName} ${item.senderLastname}`;
  
  return (
    <View className="flex-row justify-between items-start border border-border rounded-[12px] p-[10px] mb-3 bg-white">
      <Image
        source={item?.Image ? {uri: VIDEO_URL+item?.Image} : {uri: 'https://randomuser.me/api/portraits/women/1.jpg'}}
        style={{ width: 50, height: 50, borderRadius: 12 }}
      />
      <View className="flex-1 px-3">
        <Text
          className="text-[15px] text-dark font-medium"
          style={{ fontFamily: "SF Pro Display" }}
        >
          {fullName}
        </Text>
        <Text
          className="text-[11px] text-[#818387] font-normal"
          style={{ fontFamily: "SF Pro Display" }}
        >
          {item.msg}
        </Text>
      </View>
      <View>
        <Text
          className="text-[10px] text-right text-gray"
          style={{ fontFamily: "SF Pro Display" }}
        >
          {item?.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : "N/A"}
        </Text>
        {item.type && (
          <Text
            className="text-[9px] text-right text-primary mt-1"
            style={{ fontFamily: "SF Pro Display" }}
          >
            {item.type}
          </Text>
        )}
      </View>
    </View>
  );
};

export default NotificationCard;