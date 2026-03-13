import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin: string;
  condition: "Excellent" | "Good" | "Fair" | "Salvage";
  location: string;
  image: string;
  currentBid: number;
  startPrice: number;
  reservePrice: number;
  bidCount: number;
  auctionEndsAt: Date;
  isLive: boolean;
  aiScore: number;
  estimatedValue: number;
  repairCost: number;
  profitPotential: number;
}

const now = Date.now();

export const mockVehicles: Vehicle[] = [
  {
    id: "1",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    mileage: 28400,
    vin: "4T1BF1FK5CU5XXX",
    condition: "Excellent",
    location: "Los Angeles, CA",
    image: car1,
    currentBid: 18500,
    startPrice: 15000,
    reservePrice: 20000,
    bidCount: 14,
    auctionEndsAt: new Date(now + 2 * 60 * 60 * 1000),
    isLive: true,
    aiScore: 92,
    estimatedValue: 24000,
    repairCost: 0,
    profitPotential: 5500,
  },
  {
    id: "2",
    make: "BMW",
    model: "X5",
    year: 2023,
    mileage: 12800,
    vin: "5UXCR6C04N9XXX",
    condition: "Excellent",
    location: "Miami, FL",
    image: car2,
    currentBid: 42000,
    startPrice: 35000,
    reservePrice: 48000,
    bidCount: 23,
    auctionEndsAt: new Date(now + 45 * 60 * 1000),
    isLive: true,
    aiScore: 88,
    estimatedValue: 55000,
    repairCost: 800,
    profitPotential: 12200,
  },
  {
    id: "3",
    make: "Ford",
    model: "Mustang GT",
    year: 2021,
    mileage: 34200,
    vin: "1FA6P8CF5M5XXX",
    condition: "Good",
    location: "Houston, TX",
    image: car3,
    currentBid: 29800,
    startPrice: 25000,
    reservePrice: 33000,
    bidCount: 9,
    auctionEndsAt: new Date(now + 5 * 60 * 60 * 1000),
    isLive: true,
    aiScore: 85,
    estimatedValue: 36000,
    repairCost: 1200,
    profitPotential: 5000,
  },
  {
    id: "4",
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2022,
    mileage: 19600,
    vin: "W1KWF8DB6NR0XX",
    condition: "Good",
    location: "New York, NY",
    image: car4,
    currentBid: 31200,
    startPrice: 28000,
    reservePrice: 36000,
    bidCount: 17,
    auctionEndsAt: new Date(now + 20 * 60 * 1000),
    isLive: true,
    aiScore: 90,
    estimatedValue: 40000,
    repairCost: 500,
    profitPotential: 8300,
  },
  {
    id: "5",
    make: "Honda",
    model: "CR-V",
    year: 2023,
    mileage: 8900,
    vin: "2HKRW2H50NH6XX",
    condition: "Excellent",
    location: "Chicago, IL",
    image: car5,
    currentBid: 24600,
    startPrice: 22000,
    reservePrice: 28000,
    bidCount: 11,
    auctionEndsAt: new Date(now + 8 * 60 * 60 * 1000),
    isLive: false,
    aiScore: 94,
    estimatedValue: 32000,
    repairCost: 0,
    profitPotential: 7400,
  },
  {
    id: "6",
    make: "Jeep",
    model: "Wrangler",
    year: 2022,
    mileage: 22100,
    vin: "1C4HJXDG1NW2XX",
    condition: "Fair",
    location: "Denver, CO",
    image: car6,
    currentBid: 27500,
    startPrice: 24000,
    reservePrice: 32000,
    bidCount: 8,
    auctionEndsAt: new Date(now + 3 * 60 * 60 * 1000),
    isLive: true,
    aiScore: 78,
    estimatedValue: 35000,
    repairCost: 2800,
    profitPotential: 4700,
  },
];
